package postgres

import (
	"context"
	"errors"
	"strings"

	"fuse/internal/domain/eventcatalog"
	eventModels "fuse/internal/domain/eventcatalog/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type EventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) eventcatalog.Repository {
	return &EventRepository{db: db}
}

func (r *EventRepository) List(ctx context.Context, query eventcatalog.Query) (eventcatalog.Page, error) {
	limit := query.Limit
	if limit <= 0 || limit > 100 {
		limit = 30
	}
	offset := query.Offset
	if offset < 0 {
		offset = 0
	}

	dbQuery := r.db.WithContext(ctx).Model(&eventModels.DBEvent{}).Where("active = ?", true)

	if query.Country != "" {
		dbQuery = dbQuery.Where("country = ?", strings.ToUpper(query.Country))
	}
	if query.Category != "" {
		dbQuery = dbQuery.Where("category = ?", strings.ToLower(query.Category))
	}
	if query.From != nil {
		dbQuery = dbQuery.Where("start_at >= ?", *query.From)
	}
	if query.To != nil {
		dbQuery = dbQuery.Where("start_at <= ?", *query.To)
	}
	if query.Search != "" {
		pattern := "%" + strings.ToLower(query.Search) + "%"
		dbQuery = dbQuery.Where(
			"LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(city) LIKE ? OR LOWER(venue_name) LIKE ?",
			pattern,
			pattern,
			pattern,
			pattern,
		)
	}

	var total int64
	if err := dbQuery.Count(&total).Error; err != nil {
		return eventcatalog.Page{}, err
	}

	var dbEvents []eventModels.DBEvent
	if err := dbQuery.
		Order("start_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&dbEvents).Error; err != nil {
		return eventcatalog.Page{}, err
	}

	events := make([]eventcatalog.Event, len(dbEvents))
	for i, dbEvent := range dbEvents {
		events[i] = dbEvent.ToDomain()
	}

	return eventcatalog.Page{
		Events: events,
		Limit:  limit,
		Offset: offset,
		Total:  total,
	}, nil
}

func (r *EventRepository) UpsertMany(ctx context.Context, events []eventcatalog.Event) (int, error) {
	if len(events) == 0 {
		return 0, nil
	}

	dbEvents := make([]eventModels.DBEvent, 0, len(events))
	for _, event := range events {
		eventModels.EnsureID(&event)
		dbEvents = append(dbEvents, *eventModels.FromDomain(event))
	}

	err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "source"},
			{Name: "source_id"},
		},
		DoUpdates: clause.AssignmentColumns([]string{
			"source_url",
			"title",
			"description",
			"category",
			"country",
			"city",
			"venue_name",
			"address",
			"latitude",
			"longitude",
			"price_label",
			"image_url",
			"start_at",
			"end_at",
			"last_seen_at",
			"raw_text",
			"active",
			"updated_at",
		}),
	}).Create(&dbEvents).Error
	if err != nil {
		return 0, err
	}

	return len(dbEvents), nil
}

func (r *EventRepository) LatestSync(ctx context.Context) (*eventcatalog.SyncStats, error) {
	var sync eventModels.DBEventSync
	if err := r.db.WithContext(ctx).Order("ended_at DESC").First(&sync).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &eventcatalog.SyncStats{
		Found:     sync.Found,
		Saved:     sync.Saved,
		StartedAt: sync.StartedAt,
		EndedAt:   sync.EndedAt,
		Errors:    splitSyncErrors(sync.Errors),
	}, nil
}

func (r *EventRepository) SaveSync(ctx context.Context, stats eventcatalog.SyncStats) error {
	dbSync := eventModels.DBEventSync{
		Found:     stats.Found,
		Saved:     stats.Saved,
		StartedAt: stats.StartedAt,
		EndedAt:   stats.EndedAt,
		Errors:    strings.Join(stats.Errors, "\n"),
	}

	return r.db.WithContext(ctx).Create(&dbSync).Error
}

func splitSyncErrors(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}

	return strings.Split(value, "\n")
}

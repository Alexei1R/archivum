package models

import (
	"time"

	"fuse/internal/domain/eventcatalog"
	"fuse/internal/infrastructure/db"

	"github.com/google/uuid"
)

type DBEvent struct {
	db.Model
	Source      string     `gorm:"size:64;not null;uniqueIndex:idx_events_source_source_id" json:"source"`
	SourceID    string     `gorm:"size:255;not null;uniqueIndex:idx_events_source_source_id" json:"source_id"`
	SourceURL   string     `gorm:"type:text" json:"source_url"`
	Title       string     `gorm:"type:text;not null;index" json:"title"`
	Description string     `gorm:"type:text" json:"description"`
	Category    string     `gorm:"size:64;not null;index" json:"category"`
	Country     string     `gorm:"size:2;not null;index" json:"country"`
	City        string     `gorm:"size:128;index" json:"city"`
	VenueName   string     `gorm:"type:text" json:"venue_name"`
	Address     string     `gorm:"type:text" json:"address"`
	Latitude    *float64   `json:"latitude"`
	Longitude   *float64   `json:"longitude"`
	PriceLabel  string     `gorm:"size:128" json:"price_label"`
	ImageURL    string     `gorm:"type:text" json:"image_url"`
	StartAt     time.Time  `gorm:"not null;index" json:"start_at"`
	EndAt       *time.Time `json:"end_at"`
	LastSeenAt  time.Time  `gorm:"not null;index" json:"last_seen_at"`
	RawText     string     `gorm:"type:text" json:"raw_text"`
	Active      bool       `gorm:"not null;default:true;index" json:"active"`
}

type DBEventSync struct {
	db.Model
	Found     int       `gorm:"not null" json:"found"`
	Saved     int       `gorm:"not null" json:"saved"`
	StartedAt time.Time `gorm:"not null;index" json:"started_at"`
	EndedAt   time.Time `gorm:"not null;index" json:"ended_at"`
	Errors    string    `gorm:"type:text" json:"errors"`
}

func FromDomain(event eventcatalog.Event) *DBEvent {
	return &DBEvent{
		Model: db.Model{
			ID:        event.ID,
			CreatedAt: event.CreatedAt,
			UpdatedAt: event.UpdatedAt,
		},
		Source:      event.Source,
		SourceID:    event.SourceID,
		SourceURL:   event.SourceURL,
		Title:       event.Title,
		Description: event.Description,
		Category:    string(event.Category),
		Country:     event.Country,
		City:        event.City,
		VenueName:   event.VenueName,
		Address:     event.Address,
		Latitude:    event.Latitude,
		Longitude:   event.Longitude,
		PriceLabel:  event.PriceLabel,
		ImageURL:    event.ImageURL,
		StartAt:     event.StartAt,
		EndAt:       event.EndAt,
		LastSeenAt:  event.LastSeenAt,
		RawText:     event.RawText,
		Active:      event.Active,
	}
}

func (event DBEvent) ToDomain() eventcatalog.Event {
	return eventcatalog.Event{
		ID:          event.ID,
		Source:      event.Source,
		SourceID:    event.SourceID,
		SourceURL:   event.SourceURL,
		Title:       event.Title,
		Description: event.Description,
		Category:    eventcatalog.Category(event.Category),
		Country:     event.Country,
		City:        event.City,
		VenueName:   event.VenueName,
		Address:     event.Address,
		Latitude:    event.Latitude,
		Longitude:   event.Longitude,
		PriceLabel:  event.PriceLabel,
		ImageURL:    event.ImageURL,
		StartAt:     event.StartAt,
		EndAt:       event.EndAt,
		LastSeenAt:  event.LastSeenAt,
		RawText:     event.RawText,
		Active:      event.Active,
		CreatedAt:   event.CreatedAt,
		UpdatedAt:   event.UpdatedAt,
	}
}

func EnsureID(event *eventcatalog.Event) {
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
}

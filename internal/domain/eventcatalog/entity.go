package eventcatalog

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Category string

const (
	CategoryArt        Category = "art"
	CategoryBusiness   Category = "business"
	CategoryCommunity  Category = "community"
	CategoryCulture    Category = "culture"
	CategoryEducation  Category = "education"
	CategoryFood       Category = "food"
	CategoryHistory    Category = "history"
	CategoryMusic      Category = "music"
	CategoryNightlife  Category = "nightlife"
	CategoryOther      Category = "other"
	CategorySports     Category = "sports"
	CategoryTechnology Category = "technology"
	CategoryWellness   Category = "wellness"
)

type Event struct {
	ID          uuid.UUID  `json:"id"`
	Source      string     `json:"source"`
	SourceID    string     `json:"source_id"`
	SourceURL   string     `json:"source_url,omitempty"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Category    Category   `json:"category"`
	Country     string     `json:"country"`
	City        string     `json:"city,omitempty"`
	VenueName   string     `json:"venue_name,omitempty"`
	Address     string     `json:"address,omitempty"`
	Latitude    *float64   `json:"latitude,omitempty"`
	Longitude   *float64   `json:"longitude,omitempty"`
	PriceLabel  string     `json:"price_label"`
	ImageURL    string     `json:"image_url,omitempty"`
	StartAt     time.Time  `json:"start_at"`
	EndAt       *time.Time `json:"end_at,omitempty"`
	LastSeenAt  time.Time  `json:"last_seen_at"`
	RawText     string     `json:"-"`
	Active      bool       `json:"active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Query struct {
	Category string
	Country  string
	From     *time.Time
	Limit    int
	Offset   int
	Search   string
	To       *time.Time
}

type Page struct {
	Events []Event `json:"events"`
	Limit  int     `json:"limit"`
	Offset int     `json:"offset"`
	Total  int64   `json:"total"`
}

type SyncStats struct {
	Found     int       `json:"found"`
	Saved     int       `json:"saved"`
	StartedAt time.Time `json:"started_at"`
	EndedAt   time.Time `json:"ended_at"`
	Errors    []string  `json:"errors,omitempty"`
}

type Repository interface {
	List(ctx context.Context, query Query) (Page, error)
	UpsertMany(ctx context.Context, events []Event) (int, error)
	LatestSync(ctx context.Context) (*SyncStats, error)
	SaveSync(ctx context.Context, stats SyncStats) error
}

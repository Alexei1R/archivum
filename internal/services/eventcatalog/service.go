package eventcatalog

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"fuse/internal/domain/eventcatalog"
	"fuse/pkg/log"

	"github.com/PuerkitoBio/goquery"
)

const (
	sourceIabilet = "iaBilet"
	sourceIticket = "iTicket"
)

var (
	datePattern  = regexp.MustCompile(`(?i)(\d{1,2})(?:\s*[–-]\s*\d{1,2})?\s+([a-zăâîșț.]+)(?:\s+'?(\d{2,4}))?`)
	pricePattern = regexp.MustCompile(`(?i)\b(?:from|de la|începând cu|incepand cu|от)\s+([0-9^{}\s,.]+(?:lei|ron|eur|€)?)`)
	spacePattern = regexp.MustCompile(`\s+`)
)

var monthIndexes = map[string]time.Month{
	"apr":        time.April,
	"april":      time.April,
	"aprilie":    time.April,
	"aug":        time.August,
	"august":     time.August,
	"dec":        time.December,
	"december":   time.December,
	"decembrie":  time.December,
	"feb":        time.February,
	"february":   time.February,
	"februarie":  time.February,
	"ian":        time.January,
	"ianuarie":   time.January,
	"jan":        time.January,
	"january":    time.January,
	"iul":        time.July,
	"iulie":      time.July,
	"jul":        time.July,
	"july":       time.July,
	"iun":        time.June,
	"iunie":      time.June,
	"jun":        time.June,
	"june":       time.June,
	"mai":        time.May,
	"mar":        time.March,
	"march":      time.March,
	"martie":     time.March,
	"may":        time.May,
	"nov":        time.November,
	"november":   time.November,
	"noiembrie":  time.November,
	"oct":        time.October,
	"october":    time.October,
	"octombrie":  time.October,
	"sep":        time.September,
	"sept":       time.September,
	"september":  time.September,
	"septembrie": time.September,
}

type CityLocation struct {
	City      string
	Country   string
	Latitude  float64
	Longitude float64
}

var cityLocations = []CityLocation{
	{City: "Chișinău", Country: "MD", Latitude: 47.0105, Longitude: 28.8323},
	{City: "Chisinau", Country: "MD", Latitude: 47.0105, Longitude: 28.8323},
	{City: "Balti", Country: "MD", Latitude: 47.7539, Longitude: 27.9184},
	{City: "Bălți", Country: "MD", Latitude: 47.7539, Longitude: 27.9184},
	{City: "Cahul", Country: "MD", Latitude: 45.9043, Longitude: 28.1993},
	{City: "Orhei", Country: "MD", Latitude: 47.3849, Longitude: 28.8235},
	{City: "Bucharest", Country: "RO", Latitude: 44.4268, Longitude: 26.1025},
	{City: "București", Country: "RO", Latitude: 44.4268, Longitude: 26.1025},
	{City: "Iași", Country: "RO", Latitude: 47.1585, Longitude: 27.6014},
	{City: "Iasi", Country: "RO", Latitude: 47.1585, Longitude: 27.6014},
	{City: "Cluj-Napoca", Country: "RO", Latitude: 46.7712, Longitude: 23.6236},
	{City: "Timișoara", Country: "RO", Latitude: 45.7489, Longitude: 21.2087},
	{City: "Timisoara", Country: "RO", Latitude: 45.7489, Longitude: 21.2087},
	{City: "Constanța", Country: "RO", Latitude: 44.1598, Longitude: 28.6348},
	{City: "Constanta", Country: "RO", Latitude: 44.1598, Longitude: 28.6348},
	{City: "Brașov", Country: "RO", Latitude: 45.6427, Longitude: 25.5887},
	{City: "Brasov", Country: "RO", Latitude: 45.6427, Longitude: 25.5887},
	{City: "Craiova", Country: "RO", Latitude: 44.3302, Longitude: 23.7949},
	{City: "Galați", Country: "RO", Latitude: 45.4353, Longitude: 28.008},
	{City: "Ploiești", Country: "RO", Latitude: 44.9367, Longitude: 26.0129},
	{City: "Oradea", Country: "RO", Latitude: 47.0465, Longitude: 21.9189},
	{City: "Sibiu", Country: "RO", Latitude: 45.7983, Longitude: 24.1256},
}

type Source struct {
	Country string
	Name    string
	URL     string
}

type Service struct {
	client     *http.Client
	repo       eventcatalog.Repository
	sources    []Source
	syncMu     sync.Mutex
	lastSync   *eventcatalog.SyncStats
	categories map[eventcatalog.Category][]string
}

func NewService(repo eventcatalog.Repository) *Service {
	return &Service{
		client: &http.Client{Timeout: 30 * time.Second},
		repo:   repo,
		sources: []Source{
			{Name: sourceIticket, Country: "MD", URL: "https://iticket.md/en"},
			{Name: sourceIticket, Country: "MD", URL: "https://iticket.md/en/events/iticket"},
			{Name: sourceIabilet, Country: "RO", URL: "https://www.iabilet.ro/bilete-in-romania/"},
		},
		categories: map[eventcatalog.Category][]string{
			eventcatalog.CategoryMusic:      {"concert", "music", "festival", "opera", "jazz", "rock", "symphony", "muzica"},
			eventcatalog.CategorySports:     {"sport", "football", "tennis", "marathon", "race", "basketball"},
			eventcatalog.CategoryBusiness:   {"business", "conference", "summit", "networking", "startup", "conferinte"},
			eventcatalog.CategoryTechnology: {"technology", "tech", "it", "software", "ai", "hackathon"},
			eventcatalog.CategoryEducation:  {"education", "training", "workshop", "course", "lecture", "curs"},
			eventcatalog.CategoryFood:       {"food", "wine", "beer", "culinary", "restaurant", "vin"},
			eventcatalog.CategoryArt:        {"art", "gallery", "exhibition", "museum", "ballet", "expo"},
			eventcatalog.CategoryCulture:    {"culture", "theater", "theatre", "film", "cinema", "performance", "teatru", "spectacol"},
			eventcatalog.CategoryNightlife:  {"club", "party", "nightlife", "dj"},
			eventcatalog.CategoryWellness:   {"wellness", "yoga", "fitness", "health"},
			eventcatalog.CategoryCommunity:  {"community", "charity", "volunteer", "meetup"},
			eventcatalog.CategoryHistory:    {"history", "heritage"},
		},
	}
}

func (s *Service) List(ctx context.Context, query eventcatalog.Query) (eventcatalog.Page, error) {
	if query.From == nil {
		now := time.Now().Add(-24 * time.Hour)
		query.From = &now
	}

	return s.repo.List(ctx, query)
}

func (s *Service) Refresh(ctx context.Context) (eventcatalog.SyncStats, error) {
	s.syncMu.Lock()
	defer s.syncMu.Unlock()

	startedAt := time.Now().UTC()
	events, scrapeErrors := s.scrape(ctx)
	saved, err := s.repo.UpsertMany(ctx, events)
	if err != nil {
		scrapeErrors = append(scrapeErrors, err.Error())
	}

	stats := eventcatalog.SyncStats{
		Found:     len(events),
		Saved:     saved,
		StartedAt: startedAt,
		EndedAt:   time.Now().UTC(),
		Errors:    scrapeErrors,
	}

	if saveErr := s.repo.SaveSync(ctx, stats); saveErr != nil {
		log.Warn("failed to save event sync stats: %v", saveErr)
	}

	s.lastSync = &stats
	return stats, err
}

func (s *Service) LatestSync(ctx context.Context) (*eventcatalog.SyncStats, error) {
	if s.lastSync != nil {
		return s.lastSync, nil
	}

	return s.repo.LatestSync(ctx)
}

func (s *Service) scrape(ctx context.Context) ([]eventcatalog.Event, []string) {
	eventsByKey := make(map[string]eventcatalog.Event)
	var errors []string

	for _, source := range s.sources {
		html, err := s.fetch(ctx, source.URL)
		if err != nil {
			errors = append(errors, fmt.Sprintf("%s: %v", source.Name, err))
			continue
		}

		sourceEvents, err := s.parseSource(source, html)
		if err != nil {
			errors = append(errors, fmt.Sprintf("%s: %v", source.Name, err))
			continue
		}

		for _, event := range sourceEvents {
			key := event.Source + ":" + event.SourceID
			if existing, ok := eventsByKey[key]; ok && existing.ImageURL != "" {
				continue
			}
			eventsByKey[key] = event
		}
	}

	events := make([]eventcatalog.Event, 0, len(eventsByKey))
	for _, event := range eventsByKey {
		events = append(events, event)
	}

	return events, errors
}

func (s *Service) fetch(ctx context.Context, targetURL string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, targetURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	req.Header.Set("User-Agent", "Mozilla/5.0 Fuse event aggregator")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("source returned %s", resp.Status)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
	if err != nil {
		return "", err
	}

	return string(body), nil
}

func (s *Service) parseSource(source Source, html string) ([]eventcatalog.Event, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	if err != nil {
		return nil, err
	}

	switch source.Name {
	case sourceIticket:
		return s.parseIticket(source, doc), nil
	case sourceIabilet:
		return s.parseIabilet(source, doc), nil
	default:
		return nil, fmt.Errorf("unsupported source %q", source.Name)
	}
}

func (s *Service) parseIticket(source Source, doc *goquery.Document) []eventcatalog.Event {
	var events []eventcatalog.Event

	doc.Find("a[href]").Each(func(_ int, anchor *goquery.Selection) {
		text := normalize(anchor.Text())
		if len(text) < 12 {
			return
		}

		dateText := findDateText(text)
		if dateText == "" {
			return
		}

		href, _ := anchor.Attr("href")
		title := normalize(strings.TrimSpace(strings.Replace(text, dateText, "", 1)))
		title = pricePattern.ReplaceAllString(title, "")
		if len(title) < 4 {
			return
		}

		imageURL := resolveSelectionURL(source.URL, anchor.Find("img").First(), "src")
		event := s.buildEvent(source, title, text, dateText, href, imageURL)
		events = append(events, event)
	})

	return events
}

func (s *Service) parseIabilet(source Source, doc *goquery.Document) []eventcatalog.Event {
	var events []eventcatalog.Event

	doc.Find(`a[href*="/bilete-"]`).Each(func(_ int, anchor *goquery.Selection) {
		title := normalize(anchor.Text())
		if len(title) < 4 || strings.EqualFold(title, "ia Bilet") {
			return
		}

		container := closestEventContainer(anchor)
		text := normalize(container.Text())
		if text == "" {
			text = title
		}

		dateText := findDateText(text)
		if dateText == "" {
			return
		}

		href, _ := anchor.Attr("href")
		imageURL := resolveSelectionURL(source.URL, container.Find("img").First(), "src")
		event := s.buildEvent(source, title, text, dateText, href, imageURL)
		events = append(events, event)
	})

	return events
}

func (s *Service) buildEvent(source Source, title, rawText, dateText, href, imageURL string) eventcatalog.Event {
	now := time.Now().UTC()
	location := inferLocation(rawText, source.Country)
	sourceURL := resolveURL(source.URL, href)
	startAt := parseDate(dateText, now)
	priceLabel := "Check source"
	if match := pricePattern.FindStringSubmatch(rawText); len(match) > 1 {
		priceLabel = strings.ReplaceAll(strings.TrimSpace(match[1]), "^", "")
		priceLabel = strings.ReplaceAll(priceLabel, "{", "")
		priceLabel = strings.ReplaceAll(priceLabel, "}", "")
	}

	description := "Open the source for event details."
	if len(rawText) > 0 {
		description = rawText
		if len(description) > 500 {
			description = description[:500]
		}
	}

	return eventcatalog.Event{
		Source:      source.Name,
		SourceID:    stableID(source.Name + ":" + sourceURL + ":" + title + ":" + startAt.Format("2006-01-02")),
		SourceURL:   sourceURL,
		Title:       title,
		Description: description,
		Category:    s.categoryFor(rawText + " " + title),
		Country:     source.Country,
		City:        location.City,
		VenueName:   inferVenue(rawText, title),
		Address:     location.City,
		Latitude:    &location.Latitude,
		Longitude:   &location.Longitude,
		PriceLabel:  priceLabel,
		ImageURL:    imageURL,
		StartAt:     startAt,
		LastSeenAt:  now,
		RawText:     rawText,
		Active:      true,
	}
}

func (s *Service) categoryFor(text string) eventcatalog.Category {
	lower := strings.ToLower(text)
	for category, keywords := range s.categories {
		for _, keyword := range keywords {
			if strings.Contains(lower, keyword) {
				return category
			}
		}
	}
	return eventcatalog.CategoryOther
}

func closestEventContainer(anchor *goquery.Selection) *goquery.Selection {
	selectors := []string{"article", "li", ".event", ".event-item", ".eventBox", ".card", ".item"}
	for _, selector := range selectors {
		if container := anchor.Closest(selector); container.Length() > 0 {
			return container
		}
	}
	if parent := anchor.Parent(); parent.Length() > 0 {
		return parent
	}
	return anchor
}

func inferLocation(text, country string) CityLocation {
	lower := strings.ToLower(text)
	for _, location := range cityLocations {
		if location.Country == country && strings.Contains(lower, strings.ToLower(location.City)) {
			return location
		}
	}
	if country == "RO" {
		return CityLocation{City: "București", Country: "RO", Latitude: 44.4268, Longitude: 26.1025}
	}
	return CityLocation{City: "Moldova", Country: "MD", Latitude: 47.0105, Longitude: 28.8323}
}

func inferVenue(rawText, title string) string {
	venue := strings.TrimSpace(strings.Replace(rawText, title, "", 1))
	venue = strings.TrimSpace(strings.Replace(venue, findDateText(venue), "", 1))
	venue = pricePattern.ReplaceAllString(venue, "")
	venue = normalize(venue)
	if len(venue) > 160 {
		return venue[:160]
	}
	return venue
}

func findDateText(text string) string {
	match := datePattern.FindStringSubmatch(text)
	if len(match) == 0 {
		return ""
	}
	return match[0]
}

func parseDate(value string, now time.Time) time.Time {
	match := datePattern.FindStringSubmatch(strings.ToLower(value))
	if len(match) < 3 {
		return now
	}

	day, err := strconv.Atoi(match[1])
	if err != nil {
		return now
	}

	monthName := strings.Trim(match[2], ".")
	month, ok := monthIndexes[monthName]
	if !ok {
		return now
	}

	year := now.Year()
	if len(match) > 3 && match[3] != "" {
		yearValue := match[3]
		if len(yearValue) == 2 {
			yearValue = "20" + yearValue
		}
		if parsedYear, parseErr := strconv.Atoi(yearValue); parseErr == nil {
			year = parsedYear
		}
	}

	parsed := time.Date(year, month, day, 12, 0, 0, 0, time.UTC)
	if len(match) <= 3 || match[3] == "" {
		if parsed.Before(now.Add(-7 * 24 * time.Hour)) {
			parsed = parsed.AddDate(1, 0, 0)
		}
	}
	return parsed
}

func normalize(value string) string {
	return strings.TrimSpace(spacePattern.ReplaceAllString(value, " "))
}

func resolveSelectionURL(baseURL string, selection *goquery.Selection, attr string) string {
	value, ok := selection.Attr(attr)
	if !ok {
		return ""
	}
	return resolveURL(baseURL, value)
}

func resolveURL(baseURL, href string) string {
	if href == "" {
		return baseURL
	}

	parsedBase, err := url.Parse(baseURL)
	if err != nil {
		return href
	}
	parsedHref, err := url.Parse(href)
	if err != nil {
		return href
	}
	return parsedBase.ResolveReference(parsedHref).String()
}

func stableID(value string) string {
	sum := sha1.Sum([]byte(value))
	return hex.EncodeToString(sum[:])
}

package session

import (
	"strconv"
	"time"
)

const (
	FieldUserID  = "user_id"
	FieldCreated = "created_at"
)

type UserSession struct {
	ID        string
	UserID    string
	Data      map[string]string
	CreatedAt time.Time
}

func (s *UserSession) ToMap() map[string]string {
	m := map[string]string{
		FieldUserID:  s.UserID,
		FieldCreated: strconv.FormatInt(s.CreatedAt.Unix(), 10),
	}
	for k, v := range s.Data {
		if k != FieldUserID && k != FieldCreated {
			m[k] = v
		}
	}
	return m
}

func UserSessionFromMap(id string, m map[string]string) *UserSession {
	us := &UserSession{
		ID:   id,
		Data: make(map[string]string, len(m)),
	}
	if v, ok := m[FieldUserID]; ok {
		us.UserID = v
	}
	if v, ok := m[FieldCreated]; ok {
		if ts, err := strconv.ParseInt(v, 10, 64); err == nil {
			us.CreatedAt = time.Unix(ts, 0)
		}
	}
	for k, v := range m {
		if k != FieldUserID && k != FieldCreated {
			us.Data[k] = v
		}
	}
	return us
}

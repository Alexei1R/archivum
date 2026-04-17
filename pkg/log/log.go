package log

import (
	"fmt"
	"io"
	"os"
	"sync"

	"github.com/sirupsen/logrus"
)

type OutputType int

const (
	Console OutputType = iota
	File
	ConsoleAndFile
)

type LevelType int

const (
	TraceLevel LevelType = iota - 1
	DebugLevel
	InfoLevel
	WarnLevel
	ErrorLevel
)

var (
	logger       *logrus.Logger
	loggerMu     sync.RWMutex
	currentFile  *os.File
	currentLevel LevelType = InfoLevel
)

type CustomFormatter struct {
	DisableColors bool
}

func (f *CustomFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	timestamp := entry.Time.Format("15:04:05")
	level := fmt.Sprintf("%-5s", entry.Level.String())

	if f.DisableColors {
		return []byte(fmt.Sprintf("[%s:%s] %s\n", level, timestamp, entry.Message)), nil
	}

	levelColor := getLevelColor(entry.Level)
	return []byte(fmt.Sprintf("%s[%s:%s]\033[0m %s\n", levelColor, level, timestamp, entry.Message)), nil
}

func getLevelColor(level logrus.Level) string {
	colors := map[logrus.Level]string{
		logrus.TraceLevel: "\033[35m",
		logrus.DebugLevel: "\033[36m",
		logrus.InfoLevel:  "\033[32m",
		logrus.WarnLevel:  "\033[33m",
		logrus.ErrorLevel: "\033[31m",
		logrus.FatalLevel: "\033[31m",
		logrus.PanicLevel: "\033[31m",
	}
	if color, ok := colors[level]; ok {
		return color
	}
	return "\033[37m"
}

func init() {
	logger = logrus.New()
	logger.SetFormatter(&CustomFormatter{DisableColors: false})
	logger.SetOutput(os.Stdout)
	logger.SetLevel(logrus.InfoLevel)
}

func Setup(output OutputType, filePath string) error {
	loggerMu.Lock()
	defer loggerMu.Unlock()

	if currentFile != nil {
		if err := currentFile.Close(); err != nil {
			fmt.Fprintf(os.Stderr, "Error closing log file: %v\n", err)
		}
		currentFile = nil
	}

	writers, err := setupWriters(output, filePath)
	if err != nil {
		return err
	}

	logger.SetOutput(io.MultiWriter(writers...))
	logger.SetFormatter(&CustomFormatter{DisableColors: output != Console})
	return nil
}

func Cleanup() error {
	loggerMu.Lock()
	defer loggerMu.Unlock()

	if currentFile != nil {
		err := currentFile.Close()
		currentFile = nil
		return err
	}
	return nil
}

func setupWriters(output OutputType, filePath string) ([]io.Writer, error) {
	var writers []io.Writer

	switch output {
	case Console:
		writers = append(writers, os.Stdout)
	case File:
		if filePath == "" {
			return nil, fmt.Errorf("file path cannot be empty for file logging")
		}
		f, err := openLogFile(filePath)
		if err != nil {
			return nil, err
		}
		currentFile = f
		writers = append(writers, f)
	case ConsoleAndFile:
		if filePath == "" {
			return nil, fmt.Errorf("file path cannot be empty for file logging")
		}
		f, err := openLogFile(filePath)
		if err != nil {
			return nil, err
		}
		currentFile = f
		writers = append(writers, os.Stdout, f)
	default:
		return nil, fmt.Errorf("invalid output type: %d", output)
	}

	return writers, nil
}

func openLogFile(filePath string) (*os.File, error) {
	return os.OpenFile(filePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
}

func SetLevel(level LevelType) {
	loggerMu.Lock()
	defer loggerMu.Unlock()

	currentLevel = level
	logger.SetLevel(mapToLogrusLevel(level))
}

func mapToLogrusLevel(level LevelType) logrus.Level {
	levels := map[LevelType]logrus.Level{
		TraceLevel: logrus.TraceLevel,
		DebugLevel: logrus.DebugLevel,
		InfoLevel:  logrus.InfoLevel,
		WarnLevel:  logrus.WarnLevel,
		ErrorLevel: logrus.ErrorLevel,
	}
	if logrusLevel, ok := levels[level]; ok {
		return logrusLevel
	}
	return logrus.InfoLevel
}

func GetLevel() LevelType {
	loggerMu.RLock()
	defer loggerMu.RUnlock()
	return currentLevel
}

func Trace(format string, args ...any) { logger.Tracef(format, args...) }
func Debug(format string, args ...any) { logger.Debugf(format, args...) }
func Info(format string, args ...any)  { logger.Infof(format, args...) }
func Warn(format string, args ...any)  { logger.Warnf(format, args...) }
func Error(format string, args ...any) { logger.Errorf(format, args...) }

func (l LevelType) String() string {
	names := map[LevelType]string{
		TraceLevel: "TRACE",
		DebugLevel: "DEBUG",
		InfoLevel:  "INFO",
		WarnLevel:  "WARN",
		ErrorLevel: "ERROR",
	}
	if name, ok := names[l]; ok {
		return name
	}
	return "UNKNOWN"
}

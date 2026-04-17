import * as React from "react"
import { Button, Input } from "@/shared/components"
import { Search as SearchIcon } from "lucide-react"
import { cn } from "@/shared/utils"
import { motion, AnimatePresence } from "framer-motion"

interface SearchProps {
    onSearch?: (value: string) => void
    onInput?: (value: string) => void
    placeholder?: string
    className?: string
}

interface SearchRef {
    focus: () => void
}

const Search = React.forwardRef<SearchRef, SearchProps>(({
    onSearch,
    onInput,
    placeholder = "Search...",
    className
}, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleButtonClick = () => {
        setIsExpanded(true)
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    const handleInputBlur = () => {
        if (!searchValue.trim()) {
            setIsExpanded(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchValue(value)
        onInput?.(value)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && searchValue.trim()) {
            onSearch?.(searchValue)
            setIsExpanded(false)
            setSearchValue("")
        }
        if (e.key === "Escape") {
            setIsExpanded(false)
            setSearchValue("")
        }
    }

    React.useImperativeHandle(ref, () => ({
        focus: () => {
            if (!isExpanded) {
                setIsExpanded(true)
                setTimeout(() => inputRef.current?.focus(), 100)
            } else {
                inputRef.current?.focus()
            }
        }
    }))

    return (
        <div className={cn("relative", className)}>
            <motion.div
                initial={false}
                animate={{ width: isExpanded ? 256 : 40 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="relative"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {!isExpanded ? (
                        <motion.div
                            key="button"
                            transition={{ duration: 0.2 }}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleButtonClick}
                                className="h-8 w-8 rounded-full"
                            >
                                <SearchIcon className="h-4 w-4" />
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="input"
                            transition={{ duration: 0.2 }}
                        >
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder={placeholder}
                                value={searchValue}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                onKeyDown={handleInputKeyDown}
                                className="h-8 pr-10 rounded-full"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {isExpanded && (
                    <SearchIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 " />
                )}
            </motion.div>
        </div>
    )
})

Search.displayName = "Search"

export { Search, type SearchRef }

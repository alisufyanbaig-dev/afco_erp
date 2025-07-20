import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function SearchableSelect({
  value,
  onValueChange,
  onSearch,
  options = [],
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
  disabled = false,
  loading = false,
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.value,
}) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOption = options.find((option) => String(getOptionValue(option)) === String(value))

  // Debounced search effect
  React.useEffect(() => {
    if (!open) return

    const timeoutId = setTimeout(() => {
      if (onSearch) {
        onSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, onSearch, open])

  // Load initial data when opened
  React.useEffect(() => {
    if (open && onSearch && options.length === 0 && !searchQuery) {
      onSearch("")
    }
  }, [open, onSearch, options.length, searchQuery])

  const handleSelect = React.useCallback((selectedValue) => {
    onValueChange(String(selectedValue) === String(value) ? "" : selectedValue)
    setOpen(false)
  }, [onValueChange, value])

  const handleOpenChange = React.useCallback((newOpen) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchQuery("")
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => {
                  const optionValue = getOptionValue(option)
                  const isSelected = String(value) === String(optionValue)
                  
                  return (
                    <CommandItem
                      key={optionValue}
                      value={String(optionValue)}
                      onSelect={() => handleSelect(optionValue)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {getOptionLabel(option)}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
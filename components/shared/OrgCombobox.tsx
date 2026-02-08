"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OrgPublicView } from "@/app/types/router";

interface OrgComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  orgs: OrgPublicView[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function OrgCombobox({
  value,
  onValueChange,
  orgs,
  placeholder = "Select organization...",
  disabled = false,
  loading = false,
}: OrgComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOrg = orgs.find((org) => org.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || loading}
        >
          {loading
            ? "Loading..."
            : selectedOrg
              ? selectedOrg.org_name
              : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-100 p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>
              {orgs.length === 0
                ? "No approved organizations for this country."
                : "No organization found."}
            </CommandEmpty>
            <CommandGroup>
              {orgs.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.org_name}
                  onSelect={() => {
                    onValueChange(org.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === org.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{org.org_name}</span>
                    {org.website && (
                      <div className="text-xs text-muted-foreground truncate max-w-75">
                        {org.website}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

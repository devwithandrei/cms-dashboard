"use client";

import { Check, ChevronsUpDown, PlusCircle, Store as StoreIcon } from "lucide-react";
import { useState } from "react";
import { Store } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { useStoreModal } from "@/hooks/use-store-modal";
import { cn } from "@/lib/utils";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface StoreSwitcherProps extends PopoverTriggerProps {
  items: Store[];
}

export default function StoreSwitcher({
  className,
  items = []
}: StoreSwitcherProps) {
  const storeModal = useStoreModal();
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const formattedItems = items.map((item) => ({
    label: item.name,
    value: item.id
  }));

  const currentStore = formattedItems.find((item) => item.value === params.storeId);

  const onStoreSelect = (store: { value: string, label: string }) => {
    setOpen(false);
    router.push(`/${store.value}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a store"
          className={cn(
            "w-[180px] sm:w-[200px] justify-between",
            "transition-all duration-200 ease-in-out",
            "border-primary/20 hover:border-primary/50",
            "bg-background/50 hover:bg-background/80",
            "focus:ring-1 focus:ring-primary/30",
            className
          )}
        >
          <div className="flex items-center truncate">
            <StoreIcon className="mr-2 h-4 w-4 text-primary/70" />
            <span className="truncate text-sm">{currentStore?.label}</span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[200px] p-0 shadow-md border-primary/20 bg-background/95 backdrop-blur-sm"
        align="start"
      >
        <Command>
          <CommandList>
            <CommandInput placeholder="Search store..." className="text-sm" />
            <CommandEmpty>No store found.</CommandEmpty>
            <CommandGroup heading="Stores">
              {formattedItems.map((store) => (
                <CommandItem
                  key={store.value}
                  onSelect={() => onStoreSelect(store)}
                  className="text-sm cursor-pointer transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <StoreIcon className="mr-2 h-4 w-4 text-primary/70" />
                    <span className="truncate">{store.label}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 text-primary",
                      "transition-opacity duration-200",
                      currentStore?.value === store.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator className="bg-primary/10" />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  storeModal.onOpen();
                }}
                className="cursor-pointer transition-colors duration-200"
              >
                <div className="flex items-center w-full text-sm font-medium">
                  <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                  Create Store
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

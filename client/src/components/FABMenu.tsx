import { useState } from "react";
import { Plus, X, Star, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddToWatchlist } from "@/hooks/useCryptoData";
import { useToast } from "@/hooks/use-toast";
import CreateAlertDialog from "./CreateAlertDialog";
import type { Cryptocurrency } from "@shared/schema";

interface FABMenuProps {
    selectedCrypto: Cryptocurrency;
}

export default function FABMenu({ selectedCrypto }: FABMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [alertDialogOpen, setAlertDialogOpen] = useState(false);
    const addToWatchlist = useAddToWatchlist();
    const { toast } = useToast();

    const handleAddToWatchlist = () => {
        addToWatchlist.mutate(
            { cryptoId: selectedCrypto.id },
            {
                onSuccess: () => {
                    toast({
                        title: "Added to watchlist",
                        description: `${selectedCrypto.name} has been added to your watchlist`
                    });
                    setIsOpen(false);
                }
            }
        );
    };

    const handleSetAlert = () => {
        setAlertDialogOpen(true);
        setIsOpen(false);
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Menu Options */}
            <div
                className={`fixed bottom-24 right-6 flex flex-col gap-3 z-50 transition-all duration-300 ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                    }`}
            >
                <Button
                    className="rounded-full w-14 h-14 shadow-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                    size="icon"
                    onClick={handleAddToWatchlist}
                    title="Add to Watchlist"
                >
                    <Star className="h-5 w-5" />
                </Button>
                <Button
                    className="rounded-full w-14 h-14 shadow-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-foreground"
                    size="icon"
                    onClick={handleSetAlert}
                    title="Set Price Alert"
                >
                    <Bell className="h-5 w-5" />
                </Button>
            </div>

            {/* Main FAB Button */}
            <Button
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-50 transition-transform duration-300 ${isOpen ? "rotate-45" : "rotate-0"
                    }`}
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                data-testid="button-quick-actions"
                title="Quick Actions"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </Button>

            {/* Alert Dialog */}
            <CreateAlertDialog
                open={alertDialogOpen}
                onOpenChange={setAlertDialogOpen}
                crypto={selectedCrypto}
            />
        </>
    );
}

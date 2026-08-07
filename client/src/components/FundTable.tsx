import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Download, Star, Bell } from "lucide-react";
import type { MutualFund } from "@shared/schema";
import {
  useFundWatchlist,
  useAddToFundWatchlist,
  useRemoveFromFundWatchlist,
} from "@/hooks/useCryptoData";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { formatLargeValue } from "@/lib/currencyFormat";

interface FundTableProps {
  funds: MutualFund[];
  isLoading: boolean;
  searchFilter?: string | null;
}

type SortField = keyof MutualFund;

export default function FundTable({ funds, isLoading, searchFilter }: FundTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("aum");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: watchlist } = useFundWatchlist();
  const { currency, convert, formatCurrency } = useCurrency();
  const addToWatchlist = useAddToFundWatchlist();
  const removeFromWatchlist = useRemoveFromFundWatchlist();
  const { toast } = useToast();

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const filteredData = searchFilter
    ? funds.filter((fund) => fund.id === searchFilter)
    : funds;

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortBy] || "";
    const bVal = b[sortBy] || "";

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    const aNum = parseFloat(aVal as string) || 0;
    const bNum = parseFloat(bVal as string) || 0;

    return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleWatchlistToggle = async (fundId: string, fundName: string) => {
    const isWatched = watchlist?.some((item) => item.fundId === fundId);

    try {
      if (isWatched) {
        await removeFromWatchlist.mutateAsync(fundId);
        toast({
          title: "Removed from watchlist",
          description: `${fundName} has been removed from your watchlist`,
        });
      } else {
        await addToWatchlist.mutateAsync({ fundId });
        toast({
          title: "Added to watchlist",
          description: `${fundName} has been added to your watchlist`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRiskLevelLabel = (level: string | null) => {
    if (!level) return "N/A";
    const num = parseInt(level);
    if (num <= 2) return "Low";
    if (num === 3) return "Medium";
    if (num === 4) return "High";
    return "Very High";
  };

  const getRiskColor = (level: string | null) => {
    if (!level) return "bg-gray-500";
    const num = parseInt(level);
    if (num <= 2) return "bg-green-500";
    if (num === 3) return "bg-yellow-500";
    if (num === 4) return "bg-orange-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold" data-testid="text-fund-table-title">
            Reksa Dana (Mutual Funds)
          </h3>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" data-testid="button-filter-funds">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="secondary" size="sm" data-testid="button-export-funds">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("name")}
                  data-testid="button-sort-name-funds"
                >
                  Name
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("nav")}
                  data-testid="button-sort-nav"
                >
                  NAV
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">1D</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">1W</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">1M</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">1Y</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">AUM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((fund) => {
              const nav = parseFloat(fund.nav || "0");
              const change1d = parseFloat(fund.change_1d || "0");
              const change1w = parseFloat(fund.change_1w || "0");
              const change1m = parseFloat(fund.change_1m || "0");
              const change1y = parseFloat(fund.change_1y || "0");
              const aum = parseFloat(fund.aum || "0");
              const isPositive1d = change1d >= 0;
              const isWatched = watchlist?.some((item) => item.fundId === fund.id);

              const convertedNav = convert(nav, "IDR", currency as any);

              return (
                <tr
                  key={fund.id}
                  className="hover:bg-muted/50 transition-colors"
                  data-testid={`row-fund-${fund.id}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {fund.image ? (
                        <img src={fund.image} alt={fund.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                          {fund.symbol || "?"}
                        </div>
                      )}
                      <div>
                        <div className="font-medium" data-testid={`text-fund-name-${fund.id}`}>
                          {fund.name}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-fund-manager-${fund.id}`}>
                          {fund.manager}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`text-fund-symbol-${fund.id}`}>
                    {fund.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold" data-testid={`text-fund-nav-${fund.id}`}>
                      {formatCurrency(convertedNav, currency as any)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 rounded px-2 py-1 ${isPositive1d ? "pulse-green" : "pulse-red"}`}>
                      {isPositive1d ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span className={`font-medium ${isPositive1d ? "profit" : "loss"}`} data-testid={`text-fund-change-1d-${fund.id}`}>
                        {isPositive1d ? "+" : ""}{change1d.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 ${change1w >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {change1w >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span data-testid={`text-fund-change-1w-${fund.id}`}>{change1w.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 ${change1m >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {change1m >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span data-testid={`text-fund-change-1m-${fund.id}`}>{change1m.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 ${change1y >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {change1y >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span data-testid={`text-fund-change-1y-${fund.id}`}>{change1y.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-fund-aum-${fund.id}`}>
                    {formatLargeValue(aum, undefined, currency as any)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="secondary"
                      className={`${getRiskColor(fund.risk_level)} text-white`}
                      data-testid={`badge-fund-risk-${fund.id}`}
                    >
                      {getRiskLevelLabel(fund.risk_level)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWatchlistToggle(fund.id, fund.name)}
                        data-testid={`button-fund-watchlist-table-${fund.id}`}
                        className={isWatched ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
                      >
                        <Star className={`h-4 w-4 ${isWatched ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-fund-alert-table-${fund.id}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} funds
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              data-testid="button-prev-page-funds"
            >
              Previous
            </Button>
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "secondary"}
                  size="sm"
                  className="w-8 h-8"
                  onClick={() => setCurrentPage(page)}
                  data-testid={`button-page-funds-${page}`}
                >
                  {page}
                </Button>
              ))}
              {totalPages > 5 && (
                <>
                  <span className="w-8 h-8 flex items-center justify-center text-sm">...</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-8 h-8"
                    onClick={() => setCurrentPage(totalPages)}
                    data-testid={`button-page-funds-${totalPages}`}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              data-testid="button-next-page-funds"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const fromIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-neutral-200 bg-white">
      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <span>Rows per page:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => {
            const nextSize = Number(val) || 50;
            onPageSizeChange(nextSize);
            onPageChange(1);
          }}
        >
          <SelectTrigger className="h-7 w-20 bg-white border-neutral-300 text-neutral-900 text-xs focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-neutral-200 text-neutral-900 text-xs">
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-neutral-400">|</span>
        <span className="font-medium text-neutral-800">
          Showing {fromIndex}–{toIndex} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-500 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="h-7 px-2 border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 disabled:opacity-40"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
            <span className="text-xs">Prev</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="h-7 px-2 border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 disabled:opacity-40"
            title="Next page"
          >
            <span className="text-xs">Next</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// @/components/ui/dialog.tsx

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ children, className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 w-full max-w-lg p-6 bg-gray-900 text-white rounded-lg shadow-lg",
        "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4">
        <X className="w-6 h-6" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);
DialogHeader.displayName = "DialogHeader";

export const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl font-semibold">{children}</h2>
);
DialogTitle.displayName = "DialogTitle";

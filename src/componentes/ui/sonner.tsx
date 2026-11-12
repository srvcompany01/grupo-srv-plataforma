"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      icons={{
        success: (
          <CircleCheckIcon />
        ),
        info: (
          <InfoIcon />
        ),
        warning: (
          <TriangleAlertIcon />
        ),
        error: (
          <OctagonXIcon />
        ),
        loading: (
          <Loader2Icon />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--primary)",
          "--normal-text": "var(--on-primary)",
          "--normal-border": "transparent",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

"use client"

import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
} from "react"

import { Button } from "@/components/ui/button"
import {
  ExpandableScreen,
  ExpandableScreenContent,
  ExpandableScreenTrigger,
  useExpandableScreen,
} from "@/components/ui/expandable-card"
import { cn } from "@/lib/utils"

interface WaitlistExpandableProps {
  label: string
  triggerClassName?: string
}

export function WaitlistExpandable({
  label,
  triggerClassName,
}: WaitlistExpandableProps) {
  const nameId = useId()
  const emailId = useId()
  const websiteId = useId()
  const companySizeId = useId()
  const messageId = useId()
  const screenLayoutId = useId().replace(/:/g, "-")
  const navTimeoutRef = useRef<number | null>(null)

  const setNavHidden = (hidden: boolean) => {
    if (hidden) {
      document.body.dataset.navHidden = "true"
    } else {
      delete document.body.dataset.navHidden
    }
  }

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        window.clearTimeout(navTimeoutRef.current)
      }
      delete document.body.dataset.navHidden
    }
  }, [])

  const handleExpandChange = (expanded: boolean) => {
    if (navTimeoutRef.current) {
      window.clearTimeout(navTimeoutRef.current)
      navTimeoutRef.current = null
    }

    if (expanded) {
      setNavHidden(true)
      return
    }

    setNavHidden(true)
    navTimeoutRef.current = window.setTimeout(() => {
      setNavHidden(false)
      navTimeoutRef.current = null
    }, 0)
  }

  return (
    <ExpandableScreen
      layoutId={screenLayoutId}
      triggerRadius="999px"
      contentRadius="24px"
      onExpandChange={handleExpandChange}
    >
      <ExpandableScreenTrigger>
        <button
          className={cn(
            "bg-white text-black font-semibold text-sm h-10 w-fit px-4 rounded-full flex items-center justify-center shadow-md",
            triggerClassName
          )}
          type="button"
        >
          {label}
        </button>
      </ExpandableScreenTrigger>

      <ExpandableScreenContent className="bg-[#4F39F6]">
        <div className="relative z-10 flex flex-col lg:flex-row h-full w-full max-w-[1100px] mx-auto items-center p-6 sm:p-10 lg:p-16 gap-8 lg:gap-16">
          {/* LEFT SIDE */}
          <div className="flex-1 flex flex-col justify-center space-y-3 w-full">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-primary-foreground leading-none tracking-[-0.03em]">
              Reserve your spot
            </h2>
            <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-primary-foreground/20">
              <p className="text-lg sm:text-xl lg:text-2xl text-primary-foreground leading-[150%] mb-4">
                The waitlist has been a game-changer for our workflow. Highly
                recommend joining early.
              </p>
            </div>
          </div>

          {/* FORM SIDE */}
          <div className="flex-1 w-full">
            <WaitlistForm
              nameId={nameId}
              emailId={emailId}
              websiteId={websiteId}
              companySizeId={companySizeId}
              messageId={messageId}
            />
          </div>
        </div>
      </ExpandableScreenContent>
    </ExpandableScreen>
  )
}

interface WaitlistFormProps {
  nameId: string
  emailId: string
  websiteId: string
  companySizeId: string
  messageId: string
}

function WaitlistForm({
  nameId,
  emailId,
  websiteId,
  companySizeId,
  messageId,
}: WaitlistFormProps) {
  const { collapse } = useExpandableScreen()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget

    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      "use-case": (form.elements.namedItem("use-case") as HTMLInputElement).value,
      "team-size": (form.elements.namedItem("team-size") as HTMLSelectElement).value,
      "excited-about": (form.elements.namedItem("excited-about") as HTMLTextAreaElement)
        .value,
    }

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbzqJA1iJms1tqCG2MB6H_4uKR252VCSmGKvcgfWP_gxWQnuRGLPn3FH1d5SUsWz827eRw/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          mode: "no-cors",
        }
      )
    } catch (error) {
      console.error("Failed to submit waitlist form", error)
    }

    form.reset()
    collapse() // closes the expandable
  }

  return (
    <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor={nameId}
          className="block text-[10px] font-mono font-normal text-primary-foreground mb-2 tracking-[0.5px] uppercase"
        >
          FULL NAME *
        </label>
        <input
          type="text"
          id={nameId}
          name="name"
          autoComplete="off"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-card border-0 text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/20 transition-all text-xs h-10"
        />
      </div>

      <div>
        <label
          htmlFor={emailId}
          className="block text-[10px] font-mono font-normal text-primary-foreground mb-2 tracking-[0.5px] uppercase"
        >
          EMAIL *
        </label>
        <input
          type="email"
          id={emailId}
          name="email"
          autoComplete="off"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-card border-0 text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/20 transition-all text-xs h-10"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label
            htmlFor={websiteId}
            className="block text-[10px] font-mono font-normal text-primary-foreground mb-2 tracking-[0.5px] uppercase"
          >
            USE CASE
          </label>
          <input
            type="text"
            id={websiteId}
            name="use-case"
            placeholder="e.g., Instagram store, clinic bookings"
            autoComplete="off"
            required
            className="w-full px-4 py-2.5 rounded-lg bg-card border-0 text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/20 transition-all resize-none text-xs h-10"
          />
        </div>

        <div className="sm:w-32 w-full">
          <label
            htmlFor={companySizeId}
            className="block text-[10px] font-mono font-normal text-primary-foreground mb-2 tracking-[0.5px] uppercase"
          >
            TEAM SIZE
          </label>
          <select
            id={companySizeId}
            name="team-size"
            autoComplete="off"
            required
            className="w-full px-4 py-2.5 rounded-lg bg-card border-0 text-primary focus:outline-none focus:ring-2 focus:ring-primary-foreground/20 transition-all text-xs h-10 team-size-select"
            defaultValue=""
          >
            <option value="" disabled>
              Select
            </option>
            <option value="solo">Solo</option>
            <option value="2-5">2-5</option>
            <option value="6-20">6-20</option>
            <option value="21-50">21-50</option>
            <option value="50+">50+</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor={messageId}
          className="block text-[10px] font-mono font-normal text-primary-foreground mb-2 tracking-[0.5px] uppercase"
        >
          WHAT ARE YOU MOST EXCITED ABOUT?
        </label>
        <textarea
          id={messageId}
          name="excited-about"
          rows={3}
          placeholder="Tell us what features you're looking forward to..."
          autoComplete="off"
          required
          className="w-full px-4 py-3 rounded-lg bg-card border-0 text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/20 transition-all resize-none text-xs"
        />
      </div>

      <Button
        type="submit"
        className="w-full px-8 py-2.5 rounded-full bg-primary-foreground text-primary font-medium hover:bg-primary-foreground/90 transition-colors tracking-[-0.03em] h-10 mb-7"
      >
        Join Waitlist
      </Button>
    </form>
  )
}
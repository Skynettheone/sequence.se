"use client";

import { Icons } from "@/components/icons";
import { OrbitingCircles } from "@/components/ui/orbiting-circle";
import Image from "next/image";
import { motion } from "motion/react";

export function DashboardPreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-background">
      {/* Gradient overlays */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-background to-transparent z-20"></div>
      <div className="pointer-events-none absolute top-0 left-0 h-32 w-full bg-gradient-to-b from-background to-transparent z-20"></div>

      {/* Center Logo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 size-20 md:size-24 bg-secondary p-3 rounded-full z-30 shadow-lg"
      >
        <Image
          src="/Q-white.svg"
          alt="Sequence3 mark"
          width={48}
          height={48}
          className="size-12 md:size-14"
          priority
        />
      </motion.div>

      {/* Orbiting Circles */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div className="relative flex h-full w-full items-center justify-center">
          {/* Inner orbit - WhatsApp */}
          <OrbitingCircles
            index={0}
            iconSize={50}
            radius={80}
            reverse
            speed={1}
            once={false}
          >
            <div className="rounded-full bg-secondary/20 p-2 backdrop-blur-sm border border-border/50">
              <Icons.whatsapp />
            </div>
          </OrbitingCircles>

          {/* Middle orbit - Messenger & Telegram */}
          <OrbitingCircles
            index={1}
            iconSize={50}
            radius={140}
            speed={0.6}
            once={false}
          >
            <div className="rounded-full bg-secondary/20 p-2 backdrop-blur-sm border border-border/50">
              <Icons.messenger />
            </div>
            <div className="rounded-full bg-secondary/20 p-2 backdrop-blur-sm border border-border/50">
              <Icons.telegram />
            </div>
          </OrbitingCircles>

          {/* Outer orbit - Facebook & Instagram */}
          <OrbitingCircles
            index={2}
            iconSize={50}
            radius={200}
            reverse
            speed={0.4}
            once={false}
          >
            <div className="rounded-full bg-secondary/20 p-2 backdrop-blur-sm border border-border/50">
              <Icons.facebook />
            </div>
            <div className="rounded-full bg-secondary/20 p-2 backdrop-blur-sm border border-border/50">
              <Icons.instagram />
            </div>
          </OrbitingCircles>
        </div>
      </div>

      {/* Stats overlay at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3 md:gap-4"
      >
        {[
          { label: "Channels", value: "5" },
          { label: "Active", value: "342" },
          { label: "Response", value: "1.2s" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
            className="bg-background/80 backdrop-blur-md rounded-lg px-3 md:px-4 py-2 border border-border/50 shadow-sm"
          >
            <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-sm md:text-base font-semibold">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}


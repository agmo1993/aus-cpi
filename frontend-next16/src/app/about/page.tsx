/**
 * About Page
 * Project information and contributors
 */

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

const contributors = [
  {
    name: "Abdul Rehman Mohammad",
    role: "Software Engineer",
    avatarUrl: "/images/arm.jpeg",
  },
];

export default function About() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 md:p-8 space-y-8">
          {/* About Section */}
          <section className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">About</h1>
            <div className="space-y-4 text-muted-foreground leading-relaxed max-w-[65ch]">
              <p>
                AusCPI charts the Consumer Price Index published by the Australian
                Bureau of Statistics. It covers the monthly and quarterly series
                for every published category, across the eight capital cities and
                the weighted average of all of them.
              </p>
              <p>
                The CPI measures how the price of a fixed basket of goods and
                services changes over time, which is what most people mean by
                inflation. It feeds into wage negotiations, pension indexation,
                and the Reserve Bank&apos;s cash rate decisions. The figures here
                come straight from the ABS release and are updated when a new one
                lands.
              </p>
            </div>
          </section>

          <Separator />

          {/* Contributors Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">Contributors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {contributors.map((contributor) => (
                <Card key={contributor.name} className="overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                    <div className="relative w-40 h-48 rounded-lg overflow-hidden">
                      <Image
                        src={contributor.avatarUrl}
                        alt={contributor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{contributor.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {contributor.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

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
            <h1 className="text-3xl font-bold tracking-tight">About</h1>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                AusCPI is a powerful dashboard that offers users a range of tools to
                analyze and visualize consumer price index (CPI) data from the
                Australian Bureau of Statistics. The dashboard is designed to help
                users monitor and explore trends in the prices of various goods and
                services, including housing, healthcare, education, transportation,
                and food. With its user-friendly interface and interactive data
                visualization tools, AusCPI provides a convenient and accessible
                platform for anyone interested in understanding the state of the
                Australian economy. By presenting CPI data in an easy-to-understand
                format, AusCPI allows users to gain valuable insights and make
                informed decisions based on the latest economic trends.
              </p>
              <p>
                Interpreting macroeconomic data from the ABS is daunting. The data
                shapes economic policies and impacts the cost of living. The CPI
                measures inflation, affecting spending, investment, and borrowing
                decisions. A basic understanding of macroeconomic data is necessary
                to make informed decisions that impact daily lives.
              </p>
            </div>
          </section>

          <Separator />

          {/* Contributors Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Contributors</h2>
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

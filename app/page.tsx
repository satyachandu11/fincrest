import HeroSection from "@/components/Hero";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { featuresData, howItWorksData, statsData } from '@/data/landing'
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mt-40">
      <HeroSection />

      <section className="py-20 bg-orange-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map(({ value, label }, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">{value}</div>
                <div className="text-gray-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to manage your Finances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresData.map(({ title, description, icon }, index) => (
              <Card key={index} className="p-6">
                <CardContent className="space-y-4 pt-4">
                  {icon}
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="text-gray-600">{description}</p>
                </CardContent>
              </Card>
            ))}

          </div>
        </div>
      </section>

      <section className="py-20 bg-orange-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">How it works?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksData.map(({ title, description, icon }, index) => (
              <div key={index} className="text-center">
                <div className="w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">{icon}</div>
                <h3 className="text-xl font-semibold mb-4">{title}</h3>
                <p className="text-gray-600">{description}</p>
              </div>
              // <Card key={index} className="p-6">
              //   <CardContent className="space-y-4 pt-4">
              //     {icon}
              //     <h3 className="text-xl font-semibold">{title}</h3>
              //     <p className="text-gray-600">{description}</p>
              //   </CardContent>
              // </Card>
            ))}

          </div>
        </div>
      </section>
    </div>

  );
}

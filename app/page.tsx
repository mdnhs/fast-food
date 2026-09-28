import { SceneContainer } from "@/components/3d/scene-container"
import { AmbientBackground } from "@/components/common/ambient-background"
import { CraftSection } from "@/components/sections/craft-section"
import { ExplodedSection } from "@/components/sections/exploded-section"
import { Footer } from "@/components/sections/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { MenuSection } from "@/components/sections/menu-section"
import { Navbar } from "@/components/sections/navbar"
import { Testimonials } from "@/components/sections/testimonials"

export default function Page() {
  return (
    <>
      <AmbientBackground />
      <SceneContainer />
      <Navbar />
      <main className="relative z-10">
        <HeroSection />
        <ExplodedSection />
        <MenuSection />
        <CraftSection />
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}

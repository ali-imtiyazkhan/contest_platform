import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import ChallengeTypes from "@/components/ChallengeTypes";
import DemoSection from "@/components/DemoSection";
import Prizes from "@/components/Prizes";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <>
      <CustomCursor />
      <ScrollReveal />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ChallengeTypes />
        <DemoSection />
        <Prizes />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

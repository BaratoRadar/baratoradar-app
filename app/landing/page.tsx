import Announcement from "@/components/landing/Announcement";
import Welcome from "@/components/landing/Welcome";
import Confidence from "@/components/landing/Confidence";
import ShoppingList from "@/components/landing/ShoppingList";
import Savings from "@/components/landing/Savings";
import HowItWorks from "@/components/landing/HowItWorks";
import Markets from "@/components/landing/Markets";
import Manifesto from "@/components/landing/Manifesto";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="bg-[#FAFBFC] text-slate-900">
      <Announcement />
      <Welcome />
      <Confidence />
      <ShoppingList />
      <Savings />
      <HowItWorks />
      <Markets />
      <Manifesto />
      <FinalCTA />
      <Footer />
    </main>
  );
}
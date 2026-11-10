import GrainOverlay from "@/components/GrainOverlay";
import HeadingReveals from "@/components/HeadingReveals";
import Marquee from "@/components/Marquee";
import Menu from "@/components/Menu";
import Nav from "@/components/Nav";
import OrderAhead from "@/components/OrderAhead";
import Preloader from "@/components/Preloader";
import Quote from "@/components/Quote";
import ScrollStage from "@/components/ScrollStage";
import Story from "@/components/Story";
import Visit from "@/components/Visit";

export default function Home() {
  return (
    <>
      <Preloader />
      <Nav />
      <main>
        <ScrollStage />
        <Marquee />
        <Story />
        <Menu />
        <Quote />
      </main>
      <Visit />
      <GrainOverlay />
      <HeadingReveals />
      <OrderAhead />
    </>
  );
}

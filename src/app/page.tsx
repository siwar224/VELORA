import GrainOverlay from "@/components/GrainOverlay";
import Menu from "@/components/Menu";
import Nav from "@/components/Nav";
import ScrollStage from "@/components/ScrollStage";
import Story from "@/components/Story";
import Visit from "@/components/Visit";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <ScrollStage />
        <Story />
        <Menu />
      </main>
      <Visit />
      <GrainOverlay />
    </>
  );
}

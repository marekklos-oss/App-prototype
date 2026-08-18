import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Direct — klikací prototyp mobilní appky",
  description: "Klikací prototyp mobilní aplikace Direct.",
};

export default function Home() {
  return (
    <main>
      <iframe
        title="Direct — klikací prototyp mobilní appky"
        src="/prototype/index.html"
      />
    </main>
  );
}

export function PageIntro({
  index,
  title,
  lede,
  tone = "display",
}: {
  index: string;
  title: string;
  lede: string;
  tone?: "display" | "console";
}) {
  return (
    <header className={tone === "console" ? "page-intro is-console" : "page-intro"}>
      <p className="kicker">{index}</p>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>
    </header>
  );
}

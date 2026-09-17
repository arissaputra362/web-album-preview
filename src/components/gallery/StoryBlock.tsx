interface StoryBlockProps {
  story: string;
}

export default function StoryBlock({ story }: StoryBlockProps) {
  if (!story || story.trim().length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto my-16 px-6 text-center">
      <div className="w-8 h-[2px] bg-[#00543D] mx-auto mb-6" />
      <blockquote className="text-xl sm:text-2xl font-serif italic text-[#0A0B0C]/80 leading-relaxed">
        &ldquo;{story}&rdquo;
      </blockquote>
      <div className="w-8 h-[2px] bg-[#00543D] mx-auto mt-6" />
    </div>
  );
}


import { Link } from "react-router-dom";

export default function CreativeSoul() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-semibold mb-4">
          Your Creative Soul Studio
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          This space is designed for creative souls — artists, healers, musicians,
          writers, and visionaries — who create from feeling, intuition, and inner guidance.
        </p>
        <p className="text-lg text-gray-600 mt-4 max-w-3xl">
          These tools support your creativity, not replace it.
          They help you express what already lives inside you.
        </p>

        <Link
          to="/dashboard"
          className="inline-block mt-6 text-sm text-gray-500 underline"
        >
          ← Back to Dashboard
        </Link>
      </header>

      {/* Tools */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-medium mb-6">
          Creative Tools
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Tool 1 */}
          <div className="p-6 rounded-2xl bg-white shadow">
            <h3 className="text-xl font-semibold mb-2">
              Music & Healing Beat Companion
            </h3>
            <p className="text-gray-600 mb-4">
              Upload a beat or song and receive spiritual context,
              emotional tone, affirmations, and healing intention.
            </p>
            <button className="px-5 py-2 rounded-xl bg-black text-white">
              Create with Music
            </button>
          </div>

          {/* Tool 2 */}
          <div className="p-6 rounded-2xl bg-white shadow">
            <h3 className="text-xl font-semibold mb-2">
              Soul Writing Companion
            </h3>
            <p className="text-gray-600 mb-4">
              Turn feelings or short notes into poems, prayers,
              affirmations, or reflections — without losing your voice.
            </p>
            <button className="px-5 py-2 rounded-xl bg-black text-white">
              Write from the Heart
            </button>
          </div>

          {/* Tool 3 */}
          <div className="p-6 rounded-2xl bg-white shadow">
            <h3 className="text-xl font-semibold mb-2">
              Meditation Creator
            </h3>
            <p className="text-gray-600 mb-4">
              Create meditations using intention.
              The system helps with structure, pacing, and breath guidance.
            </p>
            <button className="px-5 py-2 rounded-xl bg-black text-white">
              Create a Meditation
            </button>
          </div>

          {/* Tool 4 */}
          <div className="p-6 rounded-2xl bg-white shadow">
            <h3 className="text-xl font-semibold mb-2">
              Energy & Intention Translator
            </h3>
            <p className="text-gray-600 mb-4">
              Describe how you feel — receive healing language,
              mantras, or spiritual guidance.
            </p>
            <button className="px-5 py-2 rounded-xl bg-black text-white">
              Translate Energy
            </button>
          </div>

        </div>
      </section>

      {/* Footer reassurance */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-gray-500 italic text-center">
          You don't need to understand technology.
          Just start with a feeling — we'll help with the rest.
        </p>
      </section>

    </div>
  );
}


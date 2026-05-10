import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Modern Diplomacy AI</h1>
      <p className="text-gray-600 mb-6">
        Negotiate, form alliances, and betray your way to victory in this
        AI-powered diplomacy game.
      </p>
      <Link
        to="/negotiation"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Start Negotiating
      </Link>
    </div>
  )
}

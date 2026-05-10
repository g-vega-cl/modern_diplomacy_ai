import { createFileRoute } from '@tanstack/react-router'
import { NegotiationPage } from '~/features/negotiation/negotiation-page'

export const Route = createFileRoute('/negotiation')({
  component: NegotiationPage,
})

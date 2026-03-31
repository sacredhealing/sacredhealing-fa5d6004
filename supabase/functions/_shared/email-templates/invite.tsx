/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to Sacred Healing</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandMark}>✦ SACRED HEALING</Text>
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>Sacred Healing</strong>
          </Link>
          . Click below to accept and begin your journey.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation →
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
        <Text style={brand}>Sacred Healing · SQI 2050</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const brandMark = { fontSize: '11px', fontWeight: '800' as const, letterSpacing: '0.3em', color: '#D4AF37', margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.7', margin: '0 0 20px' }
const link = { color: '#D4AF37', textDecoration: 'underline' }
const button = { backgroundColor: '#D4AF37', color: '#050505', fontSize: '13px', fontWeight: '700' as const, letterSpacing: '0.05em', borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0', lineHeight: '1.5' }
const brand = { fontSize: '10px', color: '#d1d5db', letterSpacing: '0.2em', textTransform: 'uppercase' as const, margin: '16px 0 0' }

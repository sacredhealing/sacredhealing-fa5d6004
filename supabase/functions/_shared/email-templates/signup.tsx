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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Sacred Healing — confirm your email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandMark}>✦ SACRED HEALING</Text>
        <Heading style={h1}>Welcome, beautiful soul</Heading>
        <Text style={text}>
          Thank you for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>Sacred Healing</strong>
          </Link>
          . Your journey begins now.
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to activate your account:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm &amp; Begin →
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={brand}>Sacred Healing · SQI 2050</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const brandMark = { fontSize: '11px', fontWeight: '800' as const, letterSpacing: '0.3em', color: '#D4AF37', margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.7', margin: '0 0 20px' }
const link = { color: '#D4AF37', textDecoration: 'underline' }
const button = { backgroundColor: '#D4AF37', color: '#050505', fontSize: '13px', fontWeight: '700' as const, letterSpacing: '0.05em', borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0', lineHeight: '1.5' }
const brand = { fontSize: '10px', color: '#d1d5db', letterSpacing: '0.2em', textTransform: 'uppercase' as const, margin: '16px 0 0' }

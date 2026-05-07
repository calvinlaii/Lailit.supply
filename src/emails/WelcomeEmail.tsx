import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Preview,
} from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  magicLink: string
  plan: 'Bulanan' | 'Seumur Hidup'
}

export function WelcomeEmail({ name, magicLink, plan }: WelcomeEmailProps) {
  const greeting = name ? `Hei ${name}! 👋` : 'Hei! 👋'
  const planLine =
    plan === 'Bulanan'
      ? 'Kamu baru saja berlangganan paket Bulanan.'
      : 'Kamu baru saja mendapatkan akses Seumur Hidup.'

  return (
    <Html lang="id">
      <Head />
      <Preview>Selamat datang di lailit.supply — akun kamu sudah siap!</Preview>
      <Body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          backgroundColor: '#fafafa',
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '40px 20px',
          }}
        >
          <Heading
            style={{
              fontSize: '24px',
              fontWeight: '600',
              lineHeight: '1.3',
              color: '#0a0a0a',
              margin: '0 0 16px 0',
            }}
          >
            {greeting}
          </Heading>

          <Text
            style={{
              fontSize: '16px',
              lineHeight: '1.5',
              color: '#404040',
              margin: '0 0 8px 0',
            }}
          >
            Terima kasih sudah berlangganan di{' '}
            <strong>lailit.supply</strong>.
          </Text>

          <Text
            style={{
              fontSize: '16px',
              lineHeight: '1.5',
              color: '#404040',
              margin: '0 0 32px 0',
            }}
          >
            {planLine}
          </Text>

          <Button
            href={magicLink}
            style={{
              backgroundColor: '#0a0a0a',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              display: 'inline-block',
              textDecoration: 'none',
            }}
          >
            Masuk ke Dashboard
          </Button>

          <Text
            style={{
              fontSize: '12px',
              lineHeight: '1.5',
              color: '#9e9e9e',
              marginTop: '24px',
            }}
          >
            Link ini berlaku untuk sekali login. Jika kamu tidak membuat akun
            ini, abaikan email ini.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

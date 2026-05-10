import * as React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";

/** Production logo URL — hardcoded on purpose (local/email preview may 404). */
export const LOGO_URL = "https://nurserypakistan.pk/logo.png";

export const PRIMARY_GREEN = "#2D6A4F";

export interface BrandLayoutProps {
  preview?: string;
  children: React.ReactNode;
  /** Shown under business name / address (defaults if omitted). */
  businessLocation?: string;
  footerPhone?: string | null;
}

export function BrandLayout({
  preview,
  children,
  businessLocation = "Kasur, Pakistan",
  footerPhone,
}: BrandLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.logoSection}>
            <Img src={LOGO_URL} width={160} alt="The Nursery Pakistan" style={styles.logo} />
          </Section>
          <Section style={styles.content}>{children}</Section>
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerTitle}>The Nursery Pakistan</Text>
            <Text style={styles.footerMuted}>{businessLocation}</Text>
            <Text style={styles.footerMuted}>
              <Link href="https://nurserypakistan.pk" style={styles.footerLink}>
                nurserypakistan.pk
              </Link>
            </Text>
            {footerPhone ? <Text style={styles.footerMuted}>{footerPhone}</Text> : null}
            <Text style={styles.footerNote}>This is an automated email. Please do not reply directly unless prompted.</Text>
            <Text style={styles.footerCopy}>&copy; {year} The Nursery Pakistan</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function primaryButton(label: string, href: string): React.ReactElement {
  return (
    <Link href={href} style={styles.button}>
      {label}
    </Link>
  );
}

const styles = {
  body: {
    backgroundColor: "#f6f6f6",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "0 0 28px",
  },
  logoSection: {
    padding: "28px 24px 16px",
    textAlign: "center" as const,
  },
  logo: {
    height: "auto",
    margin: "0 auto",
  },
  content: {
    padding: "12px 24px 24px",
  },
  hr: {
    borderColor: "#e8e8e8",
    margin: "0 24px",
  },
  footer: {
    padding: "20px 24px 8px",
  },
  footerTitle: {
    color: "#1a1a1a",
    fontSize: "14px",
    fontWeight: 600,
    margin: "0 0 4px",
  },
  footerMuted: {
    color: "#555555",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "4px 0",
  },
  footerLink: {
    color: PRIMARY_GREEN,
    textDecoration: "underline",
  },
  footerNote: {
    color: "#888888",
    fontSize: "12px",
    lineHeight: "18px",
    marginTop: "16px",
  },
  footerCopy: {
    color: "#aaaaaa",
    fontSize: "11px",
    marginTop: "12px",
  },
  button: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    lineHeight: 1,
    padding: "14px 28px",
    textDecoration: "none",
    textAlign: "center" as const,
  },
};

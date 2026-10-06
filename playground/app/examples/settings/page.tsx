import NextLink from 'next/link';
import { useId, type CSSProperties, type ReactNode } from 'react';
import {
  Alert,
  AppShell,
  Avatar,
  AvatarGroup,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Cluster,
  Container,
  Field,
  Grid,
  Heading,
  Icon,
  Progress,
  Select,
  Separator,
  Stack,
  Switch,
  Text,
  type Tone,
} from 'pixel-perfect';

import { Stage } from '../../../harness/Stage';
import { AlertGlyph, PlusGlyph } from '../glyphs';
import { AppFooter, AppHeader } from '../launchpad';
import { ProfileSection } from './ProfileSection';
import { SettingsNav } from './SettingsNav';
import '../examples.css';

/*
 * An account settings screen for Launchpad. A Server Component, as every
 * playground page is, with two client islands: the profile form and its
 * Save (ProfileSection), and the sidebar (SettingsNav), whose links jump to
 * the sections below, the way a long settings page works.
 */

/** A titled settings section: the anchor the sidebar jumps to, around a Card. */
function Section({
  id,
  title,
  description,
  aside,
  children,
}: {
  id: string;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section id={id} aria-labelledby={headingId} className="example-section">
      <Card>
        <CardHeader>
          <Cluster justify="between" gap="3">
            <Stack gap="1">
              <Heading level={2} size="sm" id={headingId}>
                {title}
              </Heading>
              <Text size="sm" tone="muted">
                {description}
              </Text>
            </Stack>
            {aside}
          </Cluster>
        </CardHeader>
        {children}
      </Card>
    </section>
  );
}

const NOTIFICATIONS = [
  {
    label: 'A release I started goes live',
    description: 'One email when the rollout reaches every user.',
    on: true,
  },
  {
    label: 'A release fails or is rolled back',
    description: 'At once, to you and to everyone who approved it.',
    on: true,
  },
  {
    label: 'Someone mentions me',
    description: 'Comments on releases and incidents that include @mara.',
    on: true,
  },
  {
    label: 'Weekly digest',
    description: 'Mondays at 09:00: what shipped, what broke, what is next.',
    on: false,
  },
];

/** A metered allowance: its name, its reading, and the bar the name labels. */
function Usage({ label, value, max, reading }: { label: string; value: number; max: number; reading: string }) {
  const labelId = useId();
  return (
    <Stack gap="2">
      <Cluster justify="between" gap="2">
        <Text size="sm" weight="medium" id={labelId}>
          {label}
        </Text>
        <Text size="sm" tone="muted">
          {reading}
        </Text>
      </Cluster>
      <Progress aria-labelledby={labelId} value={value} max={max} aria-valuetext={reading} />
    </Stack>
  );
}

const MEMBERS: ReadonlyArray<{ name: string; email: string; role: 'Owner' | 'Admin' | 'Member'; tone: Tone }> = [
  { name: 'Mara Ellison', email: 'mara@northwind.dev', role: 'Owner', tone: 'accent' },
  { name: 'Samuel Okafor', email: 'samuel@northwind.dev', role: 'Admin', tone: 'success' },
  { name: 'Priya Raman', email: 'priya@northwind.dev', role: 'Member', tone: 'warning' },
  { name: 'Jonas Lindqvist', email: 'jonas.lindqvist@northwind.dev', role: 'Member', tone: 'neutral' },
];

const MORE_MEMBERS: ReadonlyArray<{ name: string; tone: Tone }> = [
  { name: 'Aiko Tanaka', tone: 'accent' },
  { name: 'Diego Alvarez', tone: 'success' },
  { name: 'Lena Fischer', tone: 'warning' },
  { name: 'Tomás Ortega', tone: 'neutral' },
];

/*
 * Initials rather than photos, so a smaller overlap than the default fifth
 * of a face: at a fifth, the next face's ring covers the second letter of a
 * wide pair like "AT". The group's own documented property.
 */
const INITIALS_OVERLAP = { '--pp-avatar-group-overlap': 'var(--pp-space-1)' } as CSSProperties;

export default function SettingsExample() {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <NextLink href="/examples">Examples</NextLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Settings</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>
      <h1>Settings</h1>
      <p>
        An account settings screen in an <code>AppShell</code>. At a phone&rsquo;s width the sidebar stacks
        above the settings, Save drops under the title and every field takes a row of its own; past 720px
        the sidebar moves beside them, and on a full page the profile fields pair up. No part is told which
        width it got.
      </p>

      <Stage label="Settings screen">
        <AppShell header={<AppHeader />} sidebar={<SettingsNav />} footer={<AppFooter />}>
          <div className="example-page">
            <Container size="md">
              <Stack gap="6">
                <ProfileSection />

                <Section
                  id="settings-notifications"
                  title="Notifications"
                  description="What Launchpad emails you about. A switch takes effect as you flip it."
                >
                  <CardBody>
                    {/* An accent "on" track: the tone set on an ancestor, as Switch.md says to. */}
                    <Stack gap="5" data-pp-tone="accent">
                      {NOTIFICATIONS.map((item) => (
                        <Field key={item.label} label={item.label} description={item.description} orientation="horizontal">
                          <Switch defaultChecked={item.on} />
                        </Field>
                      ))}
                    </Stack>
                  </CardBody>
                </Section>

                <Section
                  id="settings-billing"
                  title="Plan and billing"
                  description="Pro, billed yearly. Renews on 1 November 2026."
                  aside={<Badge tone="accent">Pro</Badge>}
                >
                  <CardBody>
                    <Stack gap="5">
                      <Grid minItemInlineSize="12rem" gap="5">
                        <Usage label="Build minutes" value={3412} max={5000} reading="3,412 of 5,000" />
                        <Usage label="Seats" value={8} max={10} reading="8 of 10" />
                        <Usage label="Artifact storage" value={41.2} max={100} reading="41.2 of 100 GB" />
                      </Grid>
                      <Alert
                        tone="warning"
                        title="Your card expires before the renewal"
                        icon={<AlertGlyph />}
                      >
                        <Stack gap="3">
                          <Text size="sm">
                            The Visa ending in 4242 expires at the end of October. Update it to keep Pro on 1
                            November.
                          </Text>
                          <Cluster gap="2">
                            <Button size="sm" tone="warning">
                              Update card
                            </Button>
                          </Cluster>
                        </Stack>
                      </Alert>
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Cluster justify="between" gap="3">
                      <Text size="sm" tone="muted">
                        €480 a year, and €0.008 a build minute past 5,000.
                      </Text>
                      <Cluster gap="2">
                        <Button size="sm" variant="ghost">
                          View invoices
                        </Button>
                        <Button size="sm" variant="outline">
                          Change plan
                        </Button>
                      </Cluster>
                    </Cluster>
                  </CardFooter>
                </Section>

                <Section
                  id="settings-team"
                  title="Team"
                  description="8 of 10 seats in use."
                  aside={
                    <Button size="sm" variant="outline">
                      <Icon decorative>
                        <PlusGlyph />
                      </Icon>
                      Invite
                    </Button>
                  }
                >
                  <CardBody>
                    <Stack gap="4">
                      {MEMBERS.map((member) => (
                        <Grid key={member.email} columns="auto minmax(0, 1fr) auto" gap="3" align="center">
                          <Avatar name={member.name} tone={member.tone} />
                          <Stack gap="0">
                            <Text size="sm" weight="medium" truncate>
                              {member.name}
                            </Text>
                            <Text size="sm" tone="muted" truncate>
                              {member.email}
                            </Text>
                          </Stack>
                          <Badge
                            size="sm"
                            tone={member.role === 'Owner' ? 'accent' : 'neutral'}
                            variant={member.role === 'Member' ? 'plain' : 'ghost'}
                          >
                            {member.role}
                          </Badge>
                        </Grid>
                      ))}
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Cluster gap="3">
                      <AvatarGroup max={3} label="Other members" style={INITIALS_OVERLAP}>
                        {MORE_MEMBERS.map((member) => (
                          <Avatar key={member.name} name={member.name} tone={member.tone} />
                        ))}
                      </AvatarGroup>
                      <Text size="sm" tone="muted">
                        Aiko, Diego, Lena and Tomás are members too.
                      </Text>
                    </Cluster>
                  </CardFooter>
                </Section>

                <Section
                  id="settings-security"
                  title="Security"
                  description="Rules for everyone in Northwind. They apply at once."
                >
                  <CardBody>
                    <Stack gap="5" data-pp-tone="accent">
                      <Field
                        label="Require two-factor authentication"
                        description="Anyone without it sets it up the next time they sign in."
                        orientation="horizontal"
                      >
                        <Switch defaultChecked />
                      </Field>
                      <Field
                        label="Single sign-on with SAML"
                        description="On the Enterprise plan."
                        orientation="horizontal"
                        disabled
                      >
                        <Switch />
                      </Field>
                      <Separator />
                      <Grid columns="minmax(0, 20rem)">
                        <Field label="Sign members out after" description="Counted from a session's last request.">
                          <Select defaultValue="7d">
                            <option value="8h">8 hours</option>
                            <option value="24h">24 hours</option>
                            <option value="7d">7 days</option>
                            <option value="30d">30 days</option>
                          </Select>
                        </Field>
                      </Grid>
                    </Stack>
                  </CardBody>
                </Section>

                <Card>
                  <CardBody>
                    <Cluster justify="between" gap="4">
                      <Stack gap="1">
                        <Heading level={2} size="sm">
                          Delete this workspace
                        </Heading>
                        <Text size="sm" tone="muted">
                          Removes 14 projects, 212 releases and every member&rsquo;s access. It cannot be undone.
                        </Text>
                      </Stack>
                      <Button tone="danger" variant="outline">
                        Delete workspace
                      </Button>
                    </Cluster>
                  </CardBody>
                </Card>
              </Stack>
            </Container>
          </div>
        </AppShell>
      </Stage>
    </>
  );
}

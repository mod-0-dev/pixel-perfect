'use client';

import { Field, Input, Stack, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@mod-0-dev/pixel-perfect';
import { useState } from 'react';

const SECTIONS = [
  ['general', 'General'],
  ['members', 'Members'],
  ['billing', 'Billing'],
  ['integrations', 'Integrations'],
  ['advanced', 'Advanced'],
] as const;

/** The Matrix gallery: five tabs, so the 240px cell shows the strip scrolling. */
export function Gallery() {
  return (
    <Tabs defaultValue="members">
      <TabsList>
        {SECTIONS.map(([value, label]) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SECTIONS.map(([value, label]) => (
        <TabsContent key={value} value={value}>
          <Text size="sm">The {label.toLowerCase()} panel. The strip above scrolls at a narrow width; it never wraps.</Text>
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** Automatic activation, a disabled tab, and the selected value shown. */
export function Settings({ activationMode }: { activationMode?: 'manual' }) {
  const [value, setValue] = useState('general');
  return (
    <Stack gap="2">
      <div data-testid={activationMode === 'manual' ? 'tabs-manual' : 'tabs-settings'}>
        <Tabs value={value} onValueChange={setValue} {...(activationMode ? { activationMode } : {})}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="billing" disabled>
              Billing
            </TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Text size="sm">General settings.</Text>
          </TabsContent>
          <TabsContent value="members">
            <Text size="sm">Who is in the workspace.</Text>
          </TabsContent>
          <TabsContent value="billing">
            <Text size="sm">Billing.</Text>
          </TabsContent>
          <TabsContent value="advanced">
            <Text size="sm">Things that are hard to undo.</Text>
          </TabsContent>
        </Tabs>
      </div>
      <Text size="sm" tone="muted">
        selected: {value}
      </Text>
    </Stack>
  );
}

/** A vertical strip beside its panel. */
export function Vertical() {
  return (
    <div data-testid="tabs-vertical">
      <Tabs defaultValue="profile" orientation="vertical">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Text size="sm">Your name, your photo, your pronouns.</Text>
        </TabsContent>
        <TabsContent value="security">
          <Text size="sm">Password, passkeys, sessions.</Text>
        </TabsContent>
        <TabsContent value="notifications">
          <Text size="sm">What reaches you, and where.</Text>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** A form in a kept panel beside one that unmounts. */
export function KeptForm() {
  return (
    <div data-testid="tabs-kept">
      <Tabs defaultValue="kept">
        <TabsList>
          <TabsTrigger value="kept">Kept</TabsTrigger>
          <TabsTrigger value="fresh">Fresh</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="kept" keepMounted>
          <Field label="Kept: type, switch away, come back">
            <Input placeholder="still here" />
          </Field>
        </TabsContent>
        <TabsContent value="fresh">
          <Field label="Fresh: unmounted when hidden">
            <Input placeholder="gone on return" />
          </Field>
        </TabsContent>
        <TabsContent value="other">
          <Text size="sm">Another panel.</Text>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** A right-to-left strip: no direction passed, none written. */
export function Rtl() {
  return (
    <div dir="rtl" data-testid="tabs-rtl">
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">الأول</TabsTrigger>
          <TabsTrigger value="two">الثاني</TabsTrigger>
          <TabsTrigger value="three">الثالث</TabsTrigger>
        </TabsList>
        <TabsContent value="one">
          <Text size="sm">اللوحة الأولى</Text>
        </TabsContent>
        <TabsContent value="two">
          <Text size="sm">اللوحة الثانية</Text>
        </TabsContent>
        <TabsContent value="three">
          <Text size="sm">اللوحة الثالثة</Text>
        </TabsContent>
      </Tabs>
    </div>
  );
}

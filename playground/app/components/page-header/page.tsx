/*
 * A Server Component, as the header is. NOTHING HERE WRITES AN ID (D-035 §1).
 */
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  Button,
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
  Stack,
} from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Projects</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbPage>Releases</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  );
}

export default function PageHeaderPage() {
  return (
    <>
      <h1>6.5 PageHeader</h1>
      <p>
        The top of a page: where you are, what the page is, one line about it, and the actions that
        act on the whole page at the end of the title&rsquo;s row &mdash; under the title when the
        row cannot hold both. One flex row that wraps: a part that is absent is a row that is absent.
        The description is written after the title and painted after the actions, so a screen reader
        hears the page before its buttons.
      </p>

      <section data-testid="page-header-full">
        <h2>Everything</h2>
        <Matrix>
          <PageHeader>
            <Trail />
            <PageHeaderTitle>
              Releases <Badge tone="accent">12</Badge>
            </PageHeaderTitle>
            <PageHeaderDescription>Everything shipped this quarter, newest first.</PageHeaderDescription>
            <PageHeaderActions>
              <Button variant="outline">Export</Button>
              <Button tone="accent">New release</Button>
            </PageHeaderActions>
          </PageHeader>
        </Matrix>
      </section>

      <section data-testid="page-header-bare">
        <h2>Title and actions; title alone; level 2</h2>
        <p>No breadcrumb, no empty row: the title starts at the header&rsquo;s top.</p>
        <Matrix>
          <Stack gap="6">
            <PageHeader>
              <PageHeaderTitle>Members</PageHeaderTitle>
              <PageHeaderActions>
                <Button tone="accent">Invite</Button>
              </PageHeaderActions>
            </PageHeader>
            <PageHeader>
              <PageHeaderTitle>Billing</PageHeaderTitle>
              <PageHeaderDescription>Invoices, payment methods and usage.</PageHeaderDescription>
            </PageHeader>
            <PageHeader>
              <PageHeaderTitle level={2} size="lg">
                A section that borrowed the layout
              </PageHeaderTitle>
              <PageHeaderActions>
                <Button size="sm" variant="ghost">
                  Edit
                </Button>
              </PageHeaderActions>
            </PageHeader>
          </Stack>
        </Matrix>
      </section>

      <section data-testid="page-header-rtl">
        <h2>Right-to-left</h2>
        <Matrix>
          <div dir="rtl">
            <PageHeader>
              <Trail />
              <PageHeaderTitle>الإصدارات</PageHeaderTitle>
              <PageHeaderDescription>كل ما تم شحنه هذا الربع.</PageHeaderDescription>
              <PageHeaderActions>
                <Button variant="outline">تصدير</Button>
                <Button tone="accent">إصدار جديد</Button>
              </PageHeaderActions>
            </PageHeader>
          </div>
        </Matrix>
      </section>
    </>
  );
}

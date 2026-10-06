import NextLink from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, Center, Container, Link, Stack, Text } from 'pixel-perfect';

import { Stage } from '../../../harness/Stage';
import { Brand } from '../launchpad';
import { SignUp } from './SignUp';
import '../examples.css';

/*
 * The first step of signing up for Launchpad: a centred card on the sunken
 * surface. A Server Component; the stepper and the form are the client
 * island (SignUp), because submitting one moves the other.
 */
export default function SignUpExample() {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <NextLink href="/examples">Examples</NextLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Sign-up</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>
      <h1>Sign-up</h1>
      <p>
        A sign-up card in a <code>Container</code>. At a phone&rsquo;s width the stepper turns from a row
        into a column and the card takes the whole width; on a full page the form keeps its measure in the
        middle. Press <strong>Create account</strong> with the fields empty: the error summary takes focus,
        and each message in it is a link to its field.
      </p>

      <Stage label="Sign-up screen">
        <div className="example-auth">
          <Container size="sm">
            <Stack gap="6">
              <Center>
                <Brand />
              </Center>
              <SignUp />
              <Text size="sm" align="center">
                Already have an account? <Link href="#">Sign in</Link>
              </Text>
            </Stack>
          </Container>
        </div>
      </Stage>
    </>
  );
}

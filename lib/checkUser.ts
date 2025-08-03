import { currentUser } from '@clerk/nextjs/server';
import { db } from './prisma';

interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  emailAddresses: { emailAddress: string }[];
}

interface LoggedInUser {
  id: string;
  clerkUserId: string;
  name: string;
  imageUrl: string | null;
  email: string;
}

export const checkUser = async (): Promise<LoggedInUser | null> => {
  const user = await currentUser() as ClerkUser | null;

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = `${user.firstName} ${user.lastName}`;

    // Check if a user with this email already exists (in case of recreation after deletion)
    const existingUserWithEmail = await db.user.findUnique({
      where: {
        email: user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : '',
      },
    });

    if (existingUserWithEmail) {
      // Update the existing user with the new clerkUserId
      const updatedUser = await db.user.update({
        where: { id: existingUserWithEmail.id },
        data: {
          clerkUserId: user.id,
          name,
          imageUrl: user.imageUrl,
        },
      });
      return updatedUser;
    }

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : '',
      },
    });

    return newUser;
  } catch (error: any) {
    console.error(error.message);
    return null;
  }
};
import { PrismaClient, AppointmentStatus, MessageRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create or upsert demo user
  const demoEmail = 'demo@example.com';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      passwordHash,
      name: 'Alex Morgan'
    },
    create: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: demoEmail,
      passwordHash,
      name: 'Alex Morgan'
    }
  });

  console.log(`👤 User ready: ${user.email} (ID: ${user.id})`);

  // Clear existing sample appointments for user to make seed idempotent
  await prisma.appointment.deleteMany({
    where: { userId: user.id }
  });

  // Calculate dates relative to today
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 2);

  const pastDate1 = new Date(today);
  pastDate1.setDate(today.getDate() - 14);

  const pastDate2 = new Date(today);
  pastDate2.setDate(today.getDate() - 5);

  // Create sample appointments
  await prisma.appointment.createMany({
    data: [
      {
        id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
        userId: user.id,
        service: 'General Dental Checkup',
        appointmentDate: futureDate,
        appointmentTime: '14:00',
        status: AppointmentStatus.CONFIRMED,
        notes: 'Routine 6-month cleaning and teeth inspection.'
      },
      {
        id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        userId: user.id,
        service: 'Dermatology Consultation',
        appointmentDate: pastDate1,
        appointmentTime: '10:30',
        status: AppointmentStatus.COMPLETED,
        notes: 'Annual skin allergy checkup and prescription renewal.'
      },
      {
        id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
        userId: user.id,
        service: 'Eye Examination',
        appointmentDate: pastDate2,
        appointmentTime: '16:00',
        status: AppointmentStatus.CANCELLED,
        notes: 'User rescheduled due to a scheduling conflict.'
      }
    ]
  });

  console.log('📅 Sample appointments created');

  // Seed chat session
  await prisma.chatSession.deleteMany({
    where: { userId: user.id }
  });

  const session = await prisma.chatSession.create({
    data: {
      id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
      userId: user.id,
      title: 'Dental Checkup Scheduling',
      messages: {
        create: [
          {
            id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66',
            role: MessageRole.USER,
            content: 'Hi! I want to schedule a dental checkup.'
          },
          {
            id: '06eebc99-9c0b-4ef8-bb6d-6bb9bd380077',
            role: MessageRole.ASSISTANT,
            content: 'I would be happy to help you schedule a dental checkup! What date and preferred time work best for you?',
            metadata: {
              model: 'mistral-small-latest',
              latencyMs: 420,
              intent: 'BOOK_APPOINTMENT',
              appointment: { service: 'Dental Checkup', date: null, time: null, notes: null }
            }
          },
          {
            id: '17eebc99-9c0b-4ef8-bb6d-6bb9bd380188',
            role: MessageRole.USER,
            content: 'Two days from now around 2 PM would be great.'
          },
          {
            id: '28eebc99-9c0b-4ef8-bb6d-6bb9bd380299',
            role: MessageRole.ASSISTANT,
            content: 'I have gathered your details for a General Dental Checkup in two days at 14:00. Please confirm below to finalize your booking.',
            metadata: {
              model: 'mistral-small-latest',
              latencyMs: 510,
              intent: 'BOOK_APPOINTMENT',
              readyToBook: true,
              appointment: {
                service: 'General Dental Checkup',
                date: futureDate.toISOString().split('T')[0],
                time: '14:00',
                notes: null
              }
            }
          }
        ]
      }
    }
  });

  console.log(`💬 Chat session created with initial messages (Session ID: ${session.id})`);
  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

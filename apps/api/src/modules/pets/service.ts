import { prisma } from '../../core/database.js';
import type { CreatePetInput, UpdatePetInput } from './schemas.js';

export class PetService {
  // Create a new pet
  async createPet(tutorId: string, data: CreatePetInput) {
    // Verify tutor exists
    const tutor = await prisma.tutor.findUnique({
      where: { userId: tutorId },
    });

    if (!tutor) {
      throw new Error('Tutor profile not found. Please create a tutor profile first.');
    }

    // Convert birthDate string to Date if provided
    const petData: any = {
      ...data,
      tutorId: tutor.id,
    };

    if (data.birthDate) {
      petData.birthDate = new Date(data.birthDate);
    }

    const pet = await prisma.pet.create({
      data: petData,
    });

    return pet;
  }

  // Get pet by ID
  async getPetById(petId: string, userId: string) {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!pet) {
      throw new Error('Pet not found');
    }

    // Check if user owns this pet
    if (pet.tutor.userId !== userId) {
      throw new Error('Unauthorized to view this pet');
    }

    return pet;
  }

  // List pets for a tutor
  async listPetsByTutor(tutorId: string) {
    const tutor = await prisma.tutor.findUnique({
      where: { userId: tutorId },
    });

    if (!tutor) {
      throw new Error('Tutor profile not found');
    }

    const pets = await prisma.pet.findMany({
      where: { tutorId: tutor.id },
      orderBy: { createdAt: 'desc' },
    });

    return pets;
  }

  // Update pet
  async updatePet(petId: string, userId: string, data: UpdatePetInput) {
    // Check if user owns this pet
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        tutor: true,
      },
    });

    if (!pet) {
      throw new Error('Pet not found');
    }

    if (pet.tutor.userId !== userId) {
      throw new Error('Unauthorized to update this pet');
    }

    const updatedPet = await prisma.pet.update({
      where: { id: petId },
      data: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      },
    });

    return updatedPet;
  }

  // Delete pet
  async deletePet(petId: string, userId: string) {
    // Check if user owns this pet
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        tutor: true,
      },
    });

    if (!pet) {
      throw new Error('Pet not found');
    }

    if (pet.tutor.userId !== userId) {
      throw new Error('Unauthorized to delete this pet');
    }

    await prisma.pet.delete({
      where: { id: petId },
    });

    return { message: 'Pet deleted successfully' };
  }
}

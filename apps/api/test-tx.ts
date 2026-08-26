import prisma from './src/plugins/prisma';

async function main() {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.inventory.findFirst();
      throw new Error('INVENTORY_UNAVAILABLE');
    });
  } catch (error: any) {
    console.log('Caught error type:', typeof error);
    console.log('Is instance of Error:', error instanceof Error);
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
  }
}

main().catch(console.error);

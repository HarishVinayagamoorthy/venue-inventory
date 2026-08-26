import { paymentService } from '../apps/api/src/services/payment.service';

async function main() {
  try {
    const result = await paymentService.processPaymentSimulation(
      '4a2a5ce9-b113-4717-9477-b4f8469d1afd',
      { holdId: '6fe09aea-63f3-4ccc-93d4-cd759ec64b07', result: 'SUCCESS' },
      'test-idempotency-key-' + Date.now()
    );
    console.log('SUCCESS:', result);
  } catch (error) {
    console.error('ERROR CAUGHT:', error);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });


import { NextResponse, type NextRequest } from 'next/server';
import { serverClients, findClientById, refreshClientAIInsights } from '@/lib/api-utils';

interface Params { params: { id: string } }

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    let client = findClientById(params.id);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const aiData = await refreshClientAIInsights(client);
    client = { ...client, ...aiData };
    
    // Update client in serverClients array
    const clientIndex = serverClients.findIndex(c => c.id === client!.id);
    if (clientIndex !== -1) {
      serverClients[clientIndex] = client;
    } else {
      // Should not happen if findClientById worked
      return NextResponse.json({ success: false, error: 'Client disappeared during AI refresh' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in POST /api/clients/${params.id}/refresh-ai:`, error);
    return NextResponse.json({ success: false, error: `Failed to refresh AI insights: ${errorMessage}` }, { status: 500 });
  }
}

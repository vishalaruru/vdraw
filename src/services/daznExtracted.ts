import { ExtractedDiagram } from '../types/diagram';

export const DAZN_ARCHITECTURE_DIAGRAM: ExtractedDiagram = {
  title: 'DAZN Ingestion & Distribution Platform Architecture',
  nodes: [
    // Top Row: Sports & Rights Management
    { id: 'sports_provider', label: 'Sports Provider', shape: 'rounded', x: 200, y: 40, width: 140, height: 60, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'rights_mgmt', label: 'Rights Management', shape: 'rounded', x: 200, y: 140, width: 140, height: 60, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'won', label: 'WON', shape: 'rounded', x: 400, y: 140, width: 120, height: 60, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'won_layer', label: 'WON Integration\nLayer', shape: 'rounded', x: 580, y: 140, width: 140, height: 60, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'vdp', label: 'VDP', shape: 'rounded', x: 860, y: 140, width: 120, height: 60, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'mfl_digestor', label: 'MFL Digestor', shape: 'rounded', x: 1060, y: 40, width: 140, height: 60, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },

    // Sources (Left)
    { id: 'gracenote', label: 'Gracenote', shape: 'rounded', x: 40, y: 260, width: 100, height: 50, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'imdb', label: 'IMDB', shape: 'rounded', x: 170, y: 260, width: 100, height: 50, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'mo_vam', label: 'MO/Venom/VAM', shape: 'rounded', x: 300, y: 260, width: 130, height: 50, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'ent_planning', label: 'Entertainment Planning\n(Opta/Local/Third party\nvendor)', shape: 'rectangle', x: 40, y: 350, width: 150, height: 75, fillColor: '#FFF2CC', strokeColor: '#D6B656' },

    // Ingestion & Parsing Core
    { id: 'pre_xml_parser', label: 'Pre XML Parser', shape: 'rounded', x: 230, y: 360, width: 130, height: 60, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'dazn_xml', label: 'DAZN XML', shape: 'rounded', x: 400, y: 360, width: 130, height: 60, fillColor: '#D5E8D4', strokeColor: '#82B366' },
    { id: 'dong', label: 'DONG', shape: 'rounded', x: 580, y: 360, width: 120, height: 60, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'oca', label: 'OCA', shape: 'rounded', x: 740, y: 360, width: 120, height: 60, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'dazn_feeds', label: 'DAZN FEEDS', shape: 'rounded', x: 900, y: 360, width: 130, height: 60, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    
    // Middle Streaming & Search
    { id: 'opensearch', label: 'Open Search', shape: 'cylinder', x: 920, y: 250, width: 90, height: 65, fillColor: '#FFFFFF', strokeColor: '#666666' },
    { id: 'kinesis_firehose', label: 'Kinesis / Firehose', shape: 'rectangle', x: 1080, y: 355, width: 110, height: 70, fillColor: '#DBEAFE', strokeColor: '#3B82F6' },
    { id: 'producers', label: 'Producers', shape: 'rounded', x: 1240, y: 360, width: 120, height: 60, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'sam', label: 'SAM', shape: 'rounded', x: 1460, y: 250, width: 100, height: 50, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'entitlements', label: 'Entitlements', shape: 'rounded', x: 1220, y: 260, width: 110, height: 50, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'media_orca', label: 'Media\n(MUSA/ORCA)', shape: 'rounded', x: 1350, y: 260, width: 120, height: 50, fillColor: '#FFF2CC', strokeColor: '#D6B656' },

    // Habit Central Node
    { id: 'habit', label: 'Habit', shape: 'rounded', x: 1420, y: 360, width: 140, height: 60, fillColor: '#FFF2CC', strokeColor: '#D6B656' },

    // Management (Top Right)
    { id: 'rails_mgmt', label: 'Rails Management', shape: 'rounded', x: 1580, y: 80, width: 130, height: 50, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'article_indexer', label: 'Article Indexer', shape: 'rounded', x: 1740, y: 80, width: 130, height: 50, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'page_manager', label: 'Page Manager', shape: 'rounded', x: 1640, y: 160, width: 130, height: 50, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'discovery_config', label: 'Discovery Config', shape: 'rounded', x: 1800, y: 160, width: 130, height: 50, fillColor: '#FFF2CC', strokeColor: '#D6B656' },

    // Rails Column (Sub-components)
    { id: 'rail_item_1', label: 'Rail', shape: 'rounded', x: 1680, y: 260, width: 180, height: 35, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'rail_item_2', label: 'Rails', shape: 'rounded', x: 1680, y: 305, width: 180, height: 35, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'rail_item_3', label: 'Event', shape: 'rounded', x: 1680, y: 350, width: 180, height: 35, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'rail_item_4', label: 'EPG', shape: 'rounded', x: 1680, y: 395, width: 180, height: 35, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'rail_item_5', label: 'Linear Rail', shape: 'rounded', x: 1680, y: 440, width: 180, height: 35, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'rail_item_6', label: 'Waterfront', shape: 'rounded', x: 1680, y: 485, width: 180, height: 35, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'rail_item_7', label: 'Favorites', shape: 'rounded', x: 1680, y: 530, width: 180, height: 35, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'rail_item_8', label: 'Follow Shortcuts', shape: 'rounded', x: 1680, y: 575, width: 180, height: 35, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'rail_item_9', label: 'Playback', shape: 'rounded', x: 1680, y: 620, width: 180, height: 35, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'rail_item_10', label: 'Stats & Score', shape: 'rounded', x: 1680, y: 665, width: 180, height: 35, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'rail_item_11', label: 'Viewing History', shape: 'rounded', x: 1680, y: 710, width: 180, height: 35, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'rail_item_12', label: 'Content Book', shape: 'rounded', x: 1680, y: 755, width: 180, height: 35, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'rail_item_13', label: 'Personalization', shape: 'rounded', x: 1680, y: 800, width: 180, height: 35, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'rail_item_14', label: 'Search', shape: 'rounded', x: 1680, y: 845, width: 180, height: 35, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
    { id: 'rail_item_15', label: 'Ingest MFL', shape: 'rounded', x: 1680, y: 890, width: 180, height: 35, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },
    { id: 'rail_item_16', label: 'Navigation Promotion', shape: 'rounded', x: 1680, y: 935, width: 180, height: 35, fillColor: '#DAE8FC', strokeColor: '#6C8EBF' },

    // Far Right Consumer: BFF
    { id: 'bff', label: 'BFF\n(Backend For Frontend)', shape: 'rounded', x: 2000, y: 270, width: 90, height: 690, fillColor: '#FFF2CC', strokeColor: '#D6B656' },

    // Bottom Wide Bus: Data Stream
    { id: 'data_stream', label: 'Data Stream (Kafka / Event Bus / Central Ingestion Hub)', shape: 'rounded', x: 40, y: 1040, width: 1950, height: 60, fillColor: '#FFF2CC', strokeColor: '#D6B656' },
  ],
  edges: [
    { id: 'e1', source: 'sports_provider', target: 'won', style: 'orthogonal' },
    { id: 'e2', source: 'rights_mgmt', target: 'won', style: 'orthogonal' },
    { id: 'e3', source: 'won', target: 'won_layer', style: 'orthogonal' },
    { id: 'e4', source: 'won_layer', target: 'vdp', style: 'orthogonal' },
    { id: 'e5', source: 'gracenote', target: 'pre_xml_parser', style: 'orthogonal' },
    { id: 'e6', source: 'imdb', target: 'pre_xml_parser', style: 'orthogonal' },
    { id: 'e7', source: 'mo_vam', target: 'dazn_xml', style: 'orthogonal' },
    { id: 'e8', source: 'ent_planning', target: 'pre_xml_parser', style: 'orthogonal' },
    { id: 'e9', source: 'pre_xml_parser', target: 'dazn_xml', style: 'orthogonal' },
    { id: 'e10', source: 'dazn_xml', target: 'dong', style: 'orthogonal' },
    { id: 'e11', source: 'dong', target: 'oca', style: 'orthogonal' },
    { id: 'e12', source: 'oca', target: 'dazn_feeds', style: 'orthogonal' },
    { id: 'e13', source: 'dazn_feeds', target: 'opensearch', style: 'orthogonal' },
    { id: 'e14', source: 'dazn_feeds', target: 'kinesis_firehose', style: 'orthogonal' },
    { id: 'e15', source: 'kinesis_firehose', target: 'producers', style: 'orthogonal' },
    { id: 'e16', source: 'producers', target: 'habit', style: 'orthogonal' },
    { id: 'e17', source: 'sam', target: 'habit', style: 'orthogonal' },
    { id: 'e18', source: 'mfl_digestor', target: 'sam', style: 'orthogonal' },
    { id: 'e19', source: 'rails_mgmt', target: 'page_manager', style: 'orthogonal' },
    { id: 'e20', source: 'article_indexer', target: 'page_manager', style: 'orthogonal' },
    { id: 'e21', source: 'page_manager', target: 'rail_item_1', style: 'orthogonal' },
    { id: 'e22', source: 'discovery_config', target: 'rail_item_1', style: 'orthogonal' },
    { id: 'e23', source: 'habit', target: 'rail_item_1', style: 'orthogonal' },
    { id: 'e24', source: 'rail_item_1', target: 'bff', style: 'orthogonal' },
    { id: 'e25', source: 'rail_item_6', target: 'bff', style: 'orthogonal' },
    { id: 'e26', source: 'rail_item_16', target: 'bff', style: 'orthogonal' },
    { id: 'e27', source: 'pre_xml_parser', target: 'data_stream', style: 'orthogonal' },
    { id: 'e28', source: 'dazn_xml', target: 'data_stream', style: 'orthogonal' },
    { id: 'e29', source: 'dong', target: 'data_stream', style: 'orthogonal' },
    { id: 'e30', source: 'kinesis_firehose', target: 'data_stream', style: 'orthogonal' },
    { id: 'e31', source: 'habit', target: 'data_stream', style: 'orthogonal' },
  ],
};

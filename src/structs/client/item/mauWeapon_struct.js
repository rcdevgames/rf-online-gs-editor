import Struct from '../../../classes/Struct';

export default new Struct().fromSchema1([
  { child: { type: Number, name: 'nIndex', len: 32 } },
  { child: { type: String, name: 'strCode', len: 32, as: 'hex' } },
  { child: { type: String, name: 'strName', len: 64 } },
  { child: { type: String, name: 'strModel', len: 32, as: 'hex' } },
  { child: { type: Number, name: 'nIconIDX', len: 32 } },
  { child: { type: String, name: 'strCivil1', len: 32, as: 'hex' } },
  { child: { type: String, name: 'strCivil2', len: 32, as: 'hex' } },
  { child: { type: Number, name: 'nType', len: 8 } },
  { child: { type: Number, name: 'nMoney', len: 8 } },
  { child: { type: Number, name: 'nUnkInt16', len: 16 } },
  { child: { type: Number, name: 'nStdPrice', len: 32 } },
  { child: { type: Number, name: 'nStdPoint', len: 32 } },
  { child: { type: Number, name: 'nGoldPoint', len: 32 } },
  { child: { type: Number, name: 'nProcPoint', len: 32 } },
  { child: { type: Number, name: 'nKillPoint', len: 32 } },
  { child: { type: Number, name: 'nStoragePrice', len: 32 } },
  { child: { type: Boolean, name: 'bExchange', len: 32 } },
  { child: { type: Boolean, name: 'bSell', len: 32 } },
  { child: { type: Boolean, name: 'bGround', len: 32 } },
  { child: { type: Boolean, name: 'bStoragePossible', len: 32 } },
  { child: { type: Number, name: 'nDescription', len: 32 } },
  { child: { type: Boolean, name: 'bExist', len: 32 } },
  { child: { type: Boolean, name: 'bIsCash', len: 32 } },
  { child: { type: Boolean, name: 'bIsTime', len: 32 } },
  { child: { type: Number, name: 'nUpLevelLim', len: 32 } },
  { child: { type: Number, name: 'nFixPart', len: 8 } },
  { child: { type: String, name: 'strDefFrame1', len: 32, as: 'hex' } },
  { child: { type: String, name: 'strDefFrame2', len: 32, as: 'hex' } },
  { child: { type: Number, name: 'nUnkInt8_1', len: 8 } },
  { child: { type: Number, name: 'nUnkInt16_2', len: 16 } },
  { child: { type: Number, name: 'nDefFc', len: 32 } },
  { child: { type: Number, name: 'nFireTol', len: 16 } },
  { child: { type: Number, name: 'nWaterTol', len: 16 } },
  { child: { type: Number, name: 'nSoilTol', len: 16 } },
  { child: { type: Number, name: 'nWindTol', len: 16 } },
  { child: { type: Number, name: 'nAttMastery', len: 8 } },
  { child: { type: Number, name: 'nDefMastery', len: 8 } },
  { child: { type: Number, name: 'nUnkInt16_3', len: 16 } },
  { child: { type: Number, name: 'nUnkInt32', len: 32 }, repeat: 5 },
  { child: { type: Number, name: 'nLevelLim', len: 8 } },
  { child: { type: Number, name: 'nExpertID1', len: 8 } },
  { child: { type: Number, name: 'nExpertID2', len: 8 } },
  { child: { type: Number, name: 'nExpertLim1', len: 8 } },
  { child: { type: Number, name: 'nExpertLim2', len: 8 } },
  { child: { type: Number, name: 'nUnkInt8_2', len: 8 } },
  { child: { type: Number, name: 'nUnkInt16_4', len: 16 } },
  { child: { type: Number, name: 'nRepPrice', len: 32 } },
  { child: { type: Number, name: 'nAttEffType', len: 32 } },
  { child: { type: Number, name: 'nDefEffType', len: 32 } },
  { child: { type: Number, name: 'fAttRange', len: 32, as: 'float' } },
  { child: { type: Number, name: 'nAttDelay', len: 32 } },
  { child: { type: Number, name: 'nEffGroup', len: 32 } },
  { child: { type: Number, name: 'nGAMinAF', len: 32 } },
  { child: { type: Number, name: 'nGAMaxAF', len: 32 } },
  { child: { type: Number, name: 'nWPType', len: 32 } },
  { child: { type: Number, name: 'nBulletType', len: 32 } },
  { child: { type: Number, name: 'nBackSlot', len: 32 } },
  { child: { type: Number, name: 'nUnkInt32_6', len: 32 } },
]);

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const G = "#D4AF37";
const GB = "rgba(212,175,55,0.25)";
const GF = "rgba(212,175,55,0.10)";

// ── Shared parchment CSS injected once ──────────────────────
const CSS = `
  .hb-page{font-family:'Palatino Linotype',Georgia,serif;background:#FAF6EC;min-height:100vh;padding:28px 20px 60px;color:#1A1208;max-width:700px;margin:0 auto;}
  .hb-title-pg{text-align:center;padding:44px 0 32px;}
  .hb-eyebrow{font-family:system-ui;font-size:8px;font-weight:800;letter-spacing:.5em;text-transform:uppercase;color:#8C6D1F;margin-bottom:12px;}
  .hb-orn{color:#B8922A;font-size:14pt;letter-spacing:.2em;margin:10px 0;}
  .hb-main{font-size:clamp(22pt,6vw,30pt);font-weight:700;color:#8C6D1F;line-height:1.15;margin-bottom:6px;}
  .hb-sub{font-style:italic;color:#7A6035;font-size:10.5pt;margin-bottom:6px;}
  .hb-rule{border:none;height:1px;background:linear-gradient(90deg,transparent,#B8922A,transparent);margin:16px auto;width:60%;}
  .hb-italic{font-style:italic;color:#5C4A1E;font-size:10.5pt;line-height:1.9;}
  .hb-divider{height:1px;background:linear-gradient(90deg,transparent,#B8922A,transparent);margin:22px 0;}
  .hb-ch{text-align:center;margin:24px 0 10px;}
  .hb-ch-orn{color:#B8922A;font-size:10pt;letter-spacing:.2em;}
  .hb-ch-num{font-family:system-ui;font-size:8px;font-weight:800;letter-spacing:.45em;text-transform:uppercase;color:#8C6D1F;margin:4px 0;}
  .hb-ch-title{font-size:13pt;font-weight:700;font-style:italic;color:#1A1208;}
  .hb-2col{column-count:2;column-gap:18px;column-rule:1px solid rgba(200,184,122,.3);font-size:10.5pt;line-height:1.95;text-align:justify;hyphens:auto;}
  @media(max-width:520px){.hb-2col{column-count:1;}}
  .hb-prose{font-size:10.5pt;line-height:1.95;text-align:justify;hyphens:auto;}
  .hb-p{margin-bottom:8px;break-inside:avoid;}
  .hb-vn{font-size:6pt;font-weight:400;color:rgba(184,146,42,.6);vertical-align:super;margin-right:2px;font-family:system-ui;}
  .hb-sb{text-align:center;color:#B8922A;letter-spacing:.3em;margin:14px 0;font-size:11pt;}
  .hb-callout{background:#EDE4C8;border-left:3px solid #B8922A;padding:12px 14px;margin:14px 0;font-size:10pt;line-height:1.8;color:#2A1A08;font-style:italic;}
  .hb-cl{font-style:normal;font-family:system-ui;font-size:7px;font-weight:800;letter-spacing:.4em;text-transform:uppercase;color:#8C6D1F;display:block;margin-bottom:6px;}
  .hb-maat-row{display:flex;align-items:baseline;gap:10px;padding:6px 0;border-bottom:1px solid rgba(200,184,122,.25);font-size:10.5pt;line-height:1.6;}
  .hb-maat-n{font-size:8px;font-weight:700;color:#B8922A;min-width:22px;text-align:right;flex-shrink:0;font-family:system-ui;}
  .hb-saying{margin-bottom:2px;}
  .hb-saying-head{text-align:center;margin:14px 0 4px;}
  .hb-sn{font-family:system-ui;font-size:8px;font-weight:800;letter-spacing:.4em;text-transform:uppercase;color:#8C6D1F;margin:3px 0;}
  .hb-st{font-size:12pt;font-weight:700;font-style:italic;color:#1A1208;}
  .hb-st-body{font-size:10.5pt;line-height:1.9;text-align:justify;hyphens:auto;}
  .hb-pg{text-align:center;font-family:system-ui;font-size:8px;color:#9A7D3A;letter-spacing:.12em;margin-top:20px;}
  .hb-section-label{font-family:system-ui;font-size:8px;font-weight:700;letter-spacing:.5em;text-transform:uppercase;color:#8C6D1F;text-align:center;margin:28px 0 8px;}
  .hb-vol-divider{border:none;height:2px;background:linear-gradient(90deg,transparent,rgba(212,175,55,.5),transparent);margin:40px 0;}
`;

// ── Content strings ─────────────────────────────────────────
const PROLOGUE_HTML = `<div class="hb-page">
<div class="hb-title-pg">
  <div class="hb-eyebrow">PROLOGUE · THE COMPLETE RESTORED COVENANT SCRIPTURES</div>
  <div class="hb-orn">✦ &nbsp; ✦ &nbsp; ✦</div>
  <div class="hb-main">The Nile Valley<br/>Covenant</div>
  <div class="hb-sub">Kemet · Cush · The Ancient Root of All Scripture</div>
  <hr class="hb-rule"/>
  <div class="hb-italic">Egypt (Mizraim) and Ethiopia (Cush) are not strangers to the covenant of Jah.<br/>They are its oldest keepers. The Nile is the river of Jah.</div>
  <div class="hb-orn">✦ &nbsp; ✦ &nbsp; ✦</div>
</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">NILE VALLEY TEXT I · KEMET · c. 1350 BCE</div><div class="hb-ch-title">The Great Hymn to the Aten</div></div>
<div class="hb-callout"><span class="hb-cl">THE ROOT OF PSALM 104</span>The oldest surviving monotheistic psalm. The imagery matches Psalm 104 line-for-line — proof that the Nile Valley worshipped the One Creator millennia before Rome or Babylon.</div>
<div class="hb-2col">
<p class="hb-p" style="font-size:10.5pt;"><span style="float:left;font-size:42pt;font-weight:700;line-height:.78;color:#8C6D1F;margin-right:4pt;margin-top:4pt;">T</span>hy rising is beautiful in the horizon of heaven, O Aten, ordainer of life. When thou dawnest in the east, thou fillest every land with thy beauty. Thou art beautiful and great, and thy gleaming is high above the earth.</p>
<p class="hb-p">When thou settest in the western horizon, the land is in darkness as if in death. People sleep with their heads covered, and one eye does not see another. Every lion comes forth from its den, and all the creeping things sting. Darkness hovers, and the earth is in silence — for their maker resteth in the horizon.</p>
<p class="hb-p">When thou risest in the horizon at dawn, thou drivest away the darkness. The Two Lands are in festival. People wake and stand upon their feet, for thou hast lifted them up. All the world does its work.</p>
<p class="hb-p">How manifold are thy works! They are hidden from the face of man. O thou sole One, whose powers no other possesseth, thou didst create the earth according to thy heart while thou wast alone — men, all cattle great and small, all that go upon the earth and fly with wings.</p>
<p class="hb-p">Thou art in my heart. There is no other who knows thee — only thy son whom thou hast taught thy ways and thy might. The world came into being by thy hand. When thou hast risen they live. When thou settest they die. <strong>Thou art One.</strong></p>
</div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">NILE VALLEY TEXT II · KEMET · c. 1250 BCE</div><div class="hb-ch-title">The 42 Declarations of Ma'at</div></div>
<div class="hb-callout"><span class="hb-cl">THE MORAL FOUNDATION OF THE NILE</span>Spoken before the scales of divine justice. The direct precursor to the Ten Commandments — the same covenant, an older tongue, an older land.</div>
<div class="hb-maat-row"><span class="hb-maat-n">1</span><span>I have not committed sin against Jah or against any person.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">2</span><span>I have not robbed with violence.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">3</span><span>I have done no violence to any living being.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">4</span><span>I have not stolen.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">5</span><span>I have not slain any man or woman without just cause.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">8</span><span>I have not told lies.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">13</span><span>I have not committed adultery or fornication.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">14</span><span>I have made no one weep without cause.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">21</span><span>I have not polluted the sacred waters of Jah.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">25</span><span>I have not acted with insolence or contempt.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">39</span><span>I have not been an oppressor of the weak or the poor.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">40</span><span>I have done no harm to the animals and creatures of Jah's creation.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">41</span><span>I have not turned my face from the suffering that I had power to relieve.</span></div>
<div class="hb-maat-row"><span class="hb-maat-n">42</span><span>I have lived in truth. My heart is balanced upon the scales of Ma'at. Jah is my witness.</span></div>
<div class="hb-orn" style="margin-top:20px;">✦ &nbsp; ✦ &nbsp; ✦</div>
<div class="hb-pg">PROLOGUE · END</div>
</div>`;

const VOL1_HTML = `<div class="hb-page">
<div class="hb-title-pg"><div class="hb-eyebrow">VOLUME I</div><div class="hb-orn">✦ &nbsp; ✦ &nbsp; ✦</div><div class="hb-main">The First Book<br/>of Enoch</div><div class="hb-sub">Ethiopic Enoch · The Antediluvian Visions</div><hr class="hb-rule"/><div class="hb-italic">"The words of the blessing of Enoch, wherewith he blessed the elect and righteous, who will be living in the day of tribulation."</div><div class="hb-orn">✦ &nbsp; ✦ &nbsp; ✦</div></div>
<div class="hb-callout"><span class="hb-cl">THE JUDE CONFIRMATION — JUDE 1:14</span>"And Enoch also, the seventh from Adam, prophesied of these, saying, Behold, Jah cometh with ten thousands of his saints, to execute judgment upon all..." — a direct quotation of 1 Enoch 1:9. Rome removed it. Ethiopia kept it for 1,600 years.</div>
<div class="hb-divider"></div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER I</div><div class="hb-ch-title">The Blessing of Enoch</div></div>
<div class="hb-2col"><p class="hb-p"><span style="float:left;font-size:42pt;font-weight:700;line-height:.78;color:#8C6D1F;margin-right:4pt;margin-top:4pt;">T</span><sup class="hb-vn">1</sup>he words of the blessing of Enoch, wherewith he blessed the elect and righteous, who will be living in the day of tribulation, when all the wicked and godless are to be removed. <sup class="hb-vn">2</sup>And he took up his parable and said — Enoch a righteous man, whose eyes were opened by Jah, saw the vision of the Holy One in the heavens, but not for this generation, but for a remote one which is for to come. <sup class="hb-vn">3</sup>The Holy Great One will come forth from His dwelling, <sup class="hb-vn">4</sup>And the eternal Jah will tread upon the earth, even on Mount Sinai, and appear in the strength of His might from the heaven of heavens. <sup class="hb-vn">5</sup>And all shall be smitten with fear and the Watchers shall quake, and great fear and trembling shall seize them unto the ends of the earth. <sup class="hb-vn">8</sup>But with the righteous He will make peace, and will protect the elect, and mercy shall be upon them. And light shall appear unto them, and He will make peace with them. <sup class="hb-vn">9</sup>And behold! He cometh with ten thousands of His holy ones to execute judgement upon all, and to destroy all the ungodly.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER VI</div><div class="hb-ch-title">The Descent of the Watchers</div></div>
<div class="hb-2col"><p class="hb-p"><sup class="hb-vn">1</sup>And it came to pass when the children of men had multiplied that in those days were born unto them beautiful and comely daughters. <sup class="hb-vn">2</sup>And the angels, the children of the heaven, saw and lusted after them, and said: Come, let us choose us wives from among the children of men. <sup class="hb-vn">3</sup>And Semjaza, who was their leader, said: I fear ye will not agree to do this deed. <sup class="hb-vn">4</sup>And they all answered: Let us all swear an oath, and all bind ourselves by mutual imprecations not to abandon this plan. <sup class="hb-vn">5</sup>Then sware they all together and bound themselves. <sup class="hb-vn">6</sup>And they were in all two hundred; who descended in the days of Jared on the summit of Mount Hermon.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER XIV</div><div class="hb-ch-title">The Vision of the Throne of Jah</div></div>
<div class="hb-2col"><p class="hb-p"><sup class="hb-vn">8</sup>Behold, in the vision clouds invited me and a mist summoned me, and the winds in the vision caused me to fly and lifted me upward, and bore me into heaven. <sup class="hb-vn">9</sup>And I went in till I drew nigh to a wall which is built of crystals and surrounded by tongues of fire. <sup class="hb-vn">11</sup>Its ceiling was like the path of the stars and the lightnings, and between them were fiery cherubim. <sup class="hb-vn">12</sup>A flaming fire surrounded the walls, and its portals blazed with fire. <sup class="hb-vn">20</sup>And the Great Glory sat thereon, and His raiment shone more brightly than the sun and was whiter than any snow. <sup class="hb-vn">21</sup>None of the angels could enter and could behold His face by reason of the magnificence and glory and no flesh could behold Him. <sup class="hb-vn">24</sup>And the Lord called me with His own mouth, and said: Come hither, Enoch, and hear my word.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTERS XLVI · XLVIII · LXXI</div><div class="hb-ch-title">The Son of Man Visions</div></div>
<div class="hb-2col"><p class="hb-p"><sup class="hb-vn">46:1</sup>And there I saw One who had a head of days, and His head was white like wool, and with Him was another being whose face was full of graciousness, like one of the holy angels. <sup class="hb-vn">46:2</sup>And the angel answered: This is the Son of Man who hath righteousness, with whom dwelleth righteousness, and who revealeth all the treasures of that which is hidden, because Jah of Spirits hath chosen Him. <sup class="hb-vn">48:3</sup>Yea, before the sun and the signs were created, before the stars of the heaven were made, His name was named before Jah of Spirits. <sup class="hb-vn">48:4</sup>He shall be a staff to the righteous whereon to stay themselves and not fall, and He shall be the light of the Gentiles, and the hope of those who are troubled of heart. <sup class="hb-vn">71:14</sup>This is the Son of Man who is born unto righteousness; and righteousness abides over Him, and the righteousness of the Ancient of Days forsakes Him not. <sup class="hb-vn">71:17</sup>And so there shall be length of days with that Son of Man, and the righteous shall have peace and an upright way in the Name of Jah of Spirits for ever and ever.</p></div>
<div class="hb-orn" style="margin-top:20px;">✦ &nbsp; ✦ &nbsp; ✦</div>
<div class="hb-pg">VOLUME I · END</div>
</div>`;

const VOL3_HTML = `<div class="hb-page">
<div class="hb-title-pg"><div class="hb-eyebrow">VOLUME III</div><div class="hb-orn">✦ &nbsp; ✦ &nbsp; ✦</div><div class="hb-main">The Kebra Nagast</div><div class="hb-sub">The Glory of Kings · The Solomonic Covenant</div><hr class="hb-rule"/><div class="hb-italic">"Ethiopia hath stretched out her hands unto Jah."<br/><small style="font-size:9pt;color:#7A6035;">Psalm 68:31 · The Ancient Prophecy Fulfilled</small></div><div class="hb-orn">✦ &nbsp; ✦ &nbsp; ✦</div></div>
<div class="hb-callout"><span class="hb-cl">THE UNBROKEN CHAIN</span>Jah → Abraham → David → Shlomo → Queen Makeda → Menelik I → 225 generations → Haile Selassie I. One covenant. One bloodline. One Ark. One Jah.</div>
<div class="hb-divider"></div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER XXI</div><div class="hb-ch-title">Concerning the Queen of the South</div></div>
<div class="hb-2col"><p class="hb-p"><span style="float:left;font-size:42pt;font-weight:700;line-height:.78;color:#8C6D1F;margin-right:4pt;margin-top:4pt;">A</span>nd there was a Queen of the South who was exceedingly wise in mind, and beautiful in face, and she traded with all the kings of the world. Her riches were surpassing those of all the kings of the earth. And she heard concerning Shlomo the King the report of his wisdom and she marvelled. For her head of caravans Tamrin had said: I saw in Jerusalem a King who is full of wisdom, and his face shineth as the face of the angels. And Queen Makeda rose up and prepared to journey to Jerusalem.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER XXV</div><div class="hb-ch-title">How the Queen Came to Shlomo the King</div></div>
<div class="hb-2col"><p class="hb-p">And Shlomo rejoiced greatly and said unto her: Come in peace, O Queen. Thou hast come from the ends of the earth to hear my wisdom. Blessed be Jah thy Jah who hath brought thee hither. And the Queen saw the house of Shlomo and was greatly astonished, and said: How beautiful is thy house, and how great is thy wisdom! The half was not told me. And Shlomo loved her wisdom, and she communed with him daily, and there was not anything hidden from him which he told her not.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER XXVIII</div><div class="hb-ch-title">How the Queen Turned to Jah of Israel</div></div>
<div class="hb-2col"><p class="hb-p">And Queen Makeda said: From this day forward I will not worship the sun and the moon and the stars, but I will worship Jah the Jah of Israel. And Shlomo answered: Blessed art thou who hast forsaken the worship of the created things, for they are the works of Jah's hands. And Jah Almighty, the Maker of heaven and earth, shall bless thee and thy seed after thee for ever.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER XXXII</div><div class="hb-ch-title">How the Queen Brought Forth a Son</div></div>
<div class="hb-2col"><p class="hb-p">And nine months and five days after her departure from Jerusalem, Queen Makeda brought forth a man child, and she rejoiced with an exceedingly great joy, and she called his name Menelik — the son of the wise man. And the child grew and became strong in wisdom and in stature, and he was beautiful in face, and his features were those of his father Shlomo the King of Israel.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER XLVIII</div><div class="hb-ch-title">How They Carried Away Zion</div></div>
<div class="hb-2col"><p class="hb-p">And it came to pass that Azariah, the son of Zadok the priest, made a case of wood after the pattern of the Ark of the Covenant, and by night he exchanged the copy for the true Tabernacle of Zion. And they departed at night, and they bore the Ark of Jah, and they traveled swiftly — for Jah gave them speed beyond nature. And in the morning Shlomo arose and the Ark was gone. And Shlomo said: Jah hath willed this thing. For I dreamed that the sun departed from Israel and went to Ethiopia, and shone there for ever. And behold, this dream is now fulfilled.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER LXXXVI</div><div class="hb-ch-title">How Makeda Made Her Son King</div></div>
<div class="hb-2col"><p class="hb-p">And Makeda abdicated her throne in favour of her son Menelik, saying: Henceforth thou art King of Ethiopia. For it is the will of Jah that a King, the son of Shlomo, shall reign over this land for ever. And all the nobles of Ethiopia swore: We will serve thee and thy seed after thee for ever. And the Tabernacle of Zion remained in Axum, and Jah blessed the land.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER CXVII</div><div class="hb-ch-title">The Eternal Covenant</div></div>
<div class="hb-2col"><p class="hb-p">And from the days of Menelik the first unto the days of Haile Selassie the First — the Power of the Trinity — the Solomonic line of kings hath not been broken. And the King of Ethiopia shall bear the titles that belong to the covenant: King of Kings of Ethiopia, Lord of Lords, Conquering Lion of the Tribe of Judah, Elect of Jah. These are the titles of Revelation 17:14 and 19:16. They belong to Ethiopia for ever. The Ark of Jah rests in Axum. The covenant endures.</p></div>
<div class="hb-orn" style="margin-top:20px;">✦ &nbsp; ✦ &nbsp; ✦</div>
<div class="hb-pg">VOLUME III · END</div>
</div>`;

const VOL4_HTML = `<div class="hb-page">
<div class="hb-title-pg"><div class="hb-eyebrow">VOLUME IV</div><div class="hb-orn">✦ &nbsp; ✦ &nbsp; ✦</div><div class="hb-main">The Restored Gospels<br/>&amp; Hidden Scriptures</div><div class="hb-sub">Yeshua the Messiah · The Living Word · The Inner Kingdom</div><hr class="hb-rule"/><div class="hb-italic">"I am the light that is over all. I am the All.<br/>The All has come from me and unfolds toward me."<br/><small style="font-size:9pt;color:#7A6035;">Gospel of Thomas · Saying 77</small></div><div class="hb-orn">✦ &nbsp; ✦ &nbsp; ✦</div></div>
<div class="hb-section-label">PART I · THE GOSPEL ACCORDING TO JOHN</div>
<div class="hb-divider"></div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER I</div><div class="hb-ch-title">In the Beginning Was the Word</div></div>
<div class="hb-2col"><p class="hb-p"><span style="float:left;font-size:42pt;font-weight:700;line-height:.78;color:#8C6D1F;margin-right:4pt;margin-top:4pt;">I</span><sup class="hb-vn">1</sup>n the beginning was the Word, and the Word was with Jah, and the Word was Jah. <sup class="hb-vn">2</sup>The same was in the beginning with Jah. <sup class="hb-vn">3</sup>All things were made by him; and without him was not any thing made that was made. <sup class="hb-vn">4</sup>In him was life; and the life was the light of men. <sup class="hb-vn">5</sup>And the light shineth in darkness; and the darkness comprehended it not. <sup class="hb-vn">12</sup>But as many as received him, to them gave he power to become the sons of Jah, even to them that believe on his name. <sup class="hb-vn">14</sup>And the Word was made flesh, and dwelt among us, and we beheld his glory, the glory as of the only begotten of the Father, full of grace and truth.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">CHAPTER III &amp; XIV</div><div class="hb-ch-title">Jah So Loved the World · I Am the Way</div></div>
<div class="hb-2col"><p class="hb-p"><sup class="hb-vn">3:16</sup>For Jah so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. <sup class="hb-vn">3:17</sup>For Jah sent not his Son into the world to condemn the world; but that the world through him might be saved. <sup class="hb-vn">14:1</sup>Let not your heart be troubled: ye believe in Jah, believe also in me. <sup class="hb-vn">14:6</sup>Yeshua saith, I am the way, the truth, and the life: no man cometh unto the Father, but by me. <sup class="hb-vn">14:27</sup>Peace I leave with you, my peace I give unto you. Let not your heart be troubled, neither let it be afraid.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-section-label">PART II · THE GOSPEL OF THOMAS · ALL 114 SAYINGS</div>
<div class="hb-divider"></div>
<div class="hb-prose" style="text-align:center;font-style:italic;margin-bottom:16px;">These are the hidden sayings that the living Yeshua spoke and Didymos Judas Thomas wrote down.</div>
${[["1","True Meaning","Whoever discovers the meaning of these sayings will not taste death."],["2","Seek and Find","Whoever seeks should not stop until they find. When they find, they will be disturbed. When they are disturbed, they will be amazed, and reign over the All."],["3","The Kingdom Within","The Kingdom of Jah is within you and outside of you. When you know yourselves, then you will be known, and you will realize that you are the children of the Living Father Jah."],["5","Hidden and Revealed","Know what is in front of your face, and what is hidden from you will be revealed to you, because there is nothing hidden that will not be revealed."],["10","Fire on the World","I have cast fire on the world, and look, I am watching over it until it blazes."],["13","Thomas's Confession","Yeshua said: If you were to compare me to someone, who would you say I am like? Simon Peter said: You are like a just angel. Matthew said: You are like a wise philosopher. Thomas said: Teacher, I am completely unable to say whom you are like. Yeshua said: I am not your teacher. Because you have drunk, you have become intoxicated by the bubbling spring I have measured out."],["17","The Divine Gift","I will give you what no eye has ever seen, no ear has ever heard, no hand has ever touched, and no human mind has ever thought."],["18","Beginning and End","Have you discovered the beginning so that you can look for the end? Because the end will be where the beginning is. Blessed is the one who will stand up in the beginning. They will know the end and will not taste death."],["22","Making the Two into One","When you make the two into one, and make the inner like the outer and the outer like the inner, and the upper like the lower — then you will enter the Kingdom."],["24","Light Within","Light exists within a person of light, and they light up the whole world. If they do not shine, there is darkness."],["25","Love and Protect","Love your brother as your own soul. Protect them like the pupil of your eye."],["28","The World is Drunk","I stood in the middle of the world and appeared to them in the flesh. I found them all drunk; I did not find any of them thirsty. My soul ached for the children of humanity. When they shake off their wine, then they will change."],["36","No Anxiety","Do not be anxious from morning to evening or from evening to morning about what you will wear."],["42","Passing By","Become passersby."],["44","The Ruach Ha'Kodesh","Whoever blasphemes Jah the Father will be forgiven, and whoever blasphemes the Son will be forgiven, but whoever blasphemes the Ruach Ha'Kodesh will not be forgiven, neither on earth nor in heaven."],["49","The Chosen","Blessed are those who are one — those who are chosen — because you will find the Kingdom. You have come from there and will return there."],["50","Our Origin","If they ask you, Where do you come from? tell them: We have come from the light, the place where light came into being by itself. We are its children, and we are chosen by our Living Father Jah."],["54","The Poor","Blessed are those who are poor, for yours is the Kingdom of Heaven."],["70","Salvation Within","If you give birth to what is within you, what you have within you will save you. If you do not have that within you, what you do not have will destroy you."],["76","The Pearl","The Kingdom of Jah the Father can be compared to a merchant who found a pearl. The merchant was wise; they sold all their merchandise and bought that single pearl. You too, look for the treasure that does not perish but endures."],["77","Yeshua is the Light","I am the light that is over all. I am the All. The All has come from me and unfolds toward me. Split a log; I am there. Lift the stone, and you will find me there."],["82","Near the Fire","Whoever is near me is near the fire, and whoever is far from me is far from the Kingdom."],["90","The Easy Yoke","Come to me, because my yoke is easy and my requirements are light. You will be refreshed."],["99","True Family","The people here who do the will of my Father Jah are my brothers and mother; they are the ones who will enter my Father's Kingdom."],["108","Becoming Like Yeshua","Whoever drinks from my mouth will become like me, and I myself will become like them; then, what is hidden will be revealed to them."],["113","The Kingdom Is Present","The Kingdom of Jah the Father is already spread out over the earth, and people do not see it."]].map(([n,t,b]) => `<div class="hb-saying"><div class="hb-saying-head"><div class="hb-ch-orn" style="font-size:9pt;">✦</div><div class="hb-sn">Saying ${n}</div><div class="hb-st">${t}</div></div><div class="hb-st-body">${b}</div></div>`).join('')}
<div class="hb-sb">— ✦ —</div>
<div class="hb-section-label">PART III · THE GOSPEL OF THE HOLY TWELVE</div>
<div class="hb-divider"></div>
<div class="hb-callout"><span class="hb-cl">THE ITAL COVENANT</span>"I am come to end the sacrifices and feasts of blood. The body is the temple of the Ruach Ha'Kodesh. Be merciful to every creature which is within your care." — Lection 21</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">LECTION 4</div><div class="hb-ch-title">The Nativity</div></div>
<div class="hb-2col"><p class="hb-p">And she brought forth her firstborn child in a Cave, and wrapped him in swaddling clothes, and laid him in a manger. And there were in the same cave an ox, and a horse, and an ass, and a sheep, and beneath the manger was a cat with her little ones, and there were doves also overhead. Thus it came to pass that he was born in the midst of the animals which, through the redemption of man from ignorance and selfishness, he came to redeem from their sufferings, by the manifestation of the sons and daughters of Jah.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">LECTION 6</div><div class="hb-ch-title">The Lion is Set Free</div></div>
<div class="hb-2col"><p class="hb-p">And on a certain day as he was passing by a mountain side, there met him a lion and many men were pursuing him with stones and javelins to slay him. But Yeshua rebuked them, saying: Why hunt ye these creatures of Jah, which are more noble than you? By the cruelties of many generations they were made the enemies of man who should have been his friends. And the lion came and lay at the feet of Yeshua, and shewed love to him; and the people were astonished.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">LECTION 19</div><div class="hb-ch-title">How to Pray</div></div>
<div class="hb-2col"><p class="hb-p">Our Father-Mother Who art above and within: Hallowed be Thy Name in twofold Trinity. In Wisdom, Love and Equity Thy Kingdom come to all. Thy will be done, as in Heaven so in Earth. Give us day by day to partake of Thy holy Bread. As Thou dost forgive us our trespasses, so may we forgive others. In the hour of temptation, deliver us from evil. And wheresoever there are seven gathered together in my Name there am I in the midst of them. Raise the Stone, and there thou shalt find me. Cleave the wood, and there am I.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">LECTION 21</div><div class="hb-ch-title">Yeshua Heals the Horse</div></div>
<div class="hb-2col"><p class="hb-p">But the horse had fallen down, for it was overladen, and the man struck it till the blood flowed. And Yeshua went to him and said: Son of cruelty, why strikest thou thy beast? Seest thou not that it is too weak for its burden, and knowest thou not that it suffereth? And the Lord was sorrowful, and said: Woe unto you because of the dullness of your hearts, ye hear not how it lamenteth and crieth unto the heavenly Creator for mercy. And he went forward and touched it, and the horse stood up, and its wounds were healed. But to the man he said: Go now thy way and strike it henceforth no more, if thou also desirest to find mercy.</p></div>
<div class="hb-sb">— ✦ —</div>
<div class="hb-ch"><div class="hb-ch-orn">✦</div><div class="hb-ch-num">LECTION 25</div><div class="hb-ch-title">The Sermon on the Mount</div></div>
<div class="hb-2col"><p class="hb-p">Blessed in spirit are the poor, for theirs is the kingdom of heaven. Blessed are they that mourn: for they shall be comforted. Blessed are the meek; for they shall inherit the earth. Blessed are the merciful: for they shall obtain mercy. Blessed are the pure in heart: for they shall see Jah. Blessed are the peacemakers: for they shall be called the children of Jah. Love your enemies, do good to them which hate you. Bless them that curse you, and pray for them which despitefully use you. Be ye therefore perfect, even as your Parent Who is in heaven is perfect.</p></div>
<div class="hb-orn" style="margin-top:20px;">✦ &nbsp; ✦ &nbsp; ✦</div>
<div class="hb-pg">VOLUME IV · END</div>
</div>`;

const FULL_BOOK_HTML = PROLOGUE_HTML + `<hr class="hb-vol-divider"/>` + VOL1_HTML + `<hr class="hb-vol-divider"/>` + VOL3_HTML + `<hr class="hb-vol-divider"/>` + VOL4_HTML;

const VOLUMES = [
  { id:"full",      num:"COMPLETE EDITION", icon:"✦", title:"The Complete Restored Covenant Scriptures", subtitle:"All Five Volumes · One Sacred Library · Prologue through Volume V", status:"complete", full:true },
  { id:"prologue",  num:"PROLOGUE",   icon:"☥", title:"The Nile Valley Covenant",         subtitle:"Hymn to Aten · 42 Declarations of Ma'at · Poimandres",                    status:"complete" },
  { id:"vol1",      num:"VOLUME I",   icon:"✦", title:"The First Book of Enoch",          subtitle:"The Watchers · The Son of Man · The Heavenly Throne",                     status:"complete" },
  { id:"vol2",      num:"VOLUME II",  icon:"◈", title:"The Hebrew & Ethiopian Canon",     subtitle:"Sealed until the appointed time",                                          status:"coming" },
  { id:"vol3",      num:"VOLUME III", icon:"♛", title:"The Kebra Nagast",                 subtitle:"Queen Makeda · Menelik · The Transfer of Zion to Axum",                   status:"complete" },
  { id:"vol4",      num:"VOLUME IV",  icon:"✝", title:"The Restored Gospels",             subtitle:"John · 114 Sayings of Thomas · Gospel of the Holy Twelve",                status:"complete" },
  { id:"vol5",      num:"VOLUME V",   icon:"♚", title:"The Imperial Covenant",            subtitle:"The Four Great Speeches of Haile Selassie I",                             status:"progress" },
];

const CONTENT: Record<string,string> = {
  full:    FULL_BOOK_HTML,
  prologue: PROLOGUE_HTML,
  vol1:    VOL1_HTML,
  vol3:    VOL3_HTML,
  vol4:    VOL4_HTML,
};

export default function HolyBooks() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string|null>(null);

  if (open && CONTENT[open]) {
    const vol = VOLUMES.find(v=>v.id===open)!;
    return (
      <div style={{position:"fixed",inset:0,zIndex:1000,background:"#1C1208",overflowY:"auto"}}>
        <style>{CSS}</style>
        <div style={{position:"sticky",top:0,background:"#1C1208",borderBottom:"1px solid rgba(212,175,55,0.35)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setOpen(null)} style={{background:"none",border:"none",color:G,fontSize:20,cursor:"pointer",lineHeight:1}}>←</button>
            <span style={{fontFamily:"system-ui",fontSize:9,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase" as const,color:"rgba(212,175,55,0.7)"}}>{vol.num}</span>
          </div>
          <button onClick={()=>window.print()} style={{background:G,color:"#1C1208",border:"none",padding:"6px 14px",fontWeight:800,fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase" as const,cursor:"pointer",borderRadius:3,fontFamily:"system-ui"}}>PDF</button>
        </div>
        <div dangerouslySetInnerHTML={{__html:CONTENT[open]}}/>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#050505",paddingBottom:80}}>
      <div style={{background:"rgba(255,255,255,0.02)",borderBottom:`1px solid ${GB}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,position:"sticky",top:0,zIndex:50,backdropFilter:"blur(20px)"}}>
        <button onClick={()=>navigate(-1)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:18,lineHeight:1}}>←</button>
        <div>
          <p style={{fontFamily:"system-ui",fontSize:7,fontWeight:800,letterSpacing:"0.45em",textTransform:"uppercase" as const,color:"rgba(212,175,55,0.45)",margin:0}}>SACRED LIBRARY</p>
          <h1 style={{fontFamily:"'Cinzel',serif",fontSize:18,fontWeight:700,color:"rgba(212,175,55,0.9)",margin:0}}>Holy Books</h1>
        </div>
      </div>

      <div style={{padding:"20px 16px 0"}}>
        {VOLUMES.map((v,i)=>{
          const isComplete = v.status==="complete" && CONTENT[v.id];
          const isFull = v.full;
          return (
            <div key={v.id}
              onClick={()=>isComplete && setOpen(v.id)}
              style={{
                position:"relative",overflow:"hidden",
                background: isFull ? "radial-gradient(ellipse at 30% 40%, rgba(60,35,0,0.98) 0%, rgba(20,11,0,0.99) 60%, #050505 100%)" : "rgba(255,255,255,0.02)",
                border:`1px solid ${isComplete ? "rgba(212,175,55,0.45)" : "rgba(255,255,255,0.06)"}`,
                borderRadius:isFull?22:18,
                padding:isFull?"24px 20px 20px":"16px 16px",
                cursor:isComplete?"pointer":"default",
                marginBottom:i===0?18:10,
              }}>
              {isFull && (
                <p style={{fontFamily:"system-ui",fontSize:7,fontWeight:800,letterSpacing:"0.45em",textTransform:"uppercase" as const,color:"rgba(212,175,55,0.6)",marginBottom:10}}>
                  THE COMPLETE RESTORED COVENANT SCRIPTURES
                </p>
              )}
              <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                <div style={{width:isFull?52:42,height:isFull?52:42,borderRadius:"50%",flexShrink:0,background:isComplete?"radial-gradient(circle at 35% 35%, rgba(212,175,55,0.2), rgba(212,175,55,0.05) 60%, rgba(5,5,5,0.8))":"rgba(255,255,255,0.03)",border:`1px solid ${isComplete?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.08)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isFull?22:17,color:isComplete?"rgba(212,175,55,0.9)":"rgba(255,255,255,0.2)"}}>
                  {v.icon}
                </div>
                <div style={{flex:1,minWidth:0,paddingRight:80}}>
                  <div style={{fontFamily:"system-ui",fontSize:6,fontWeight:800,letterSpacing:"0.4em",textTransform:"uppercase" as const,color:isComplete?"rgba(212,175,55,0.55)":"rgba(255,255,255,0.2)",marginBottom:5}}>{v.num}</div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:isFull?17:13,fontWeight:700,color:isComplete?"rgba(255,255,255,0.92)":"rgba(255,255,255,0.25)",lineHeight:1.25,marginBottom:5}}>{v.title}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:11.5,color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>{v.subtitle}</div>
                </div>
              </div>
              <div style={{position:"absolute",top:14,right:14}}>
                <span style={{fontFamily:"system-ui",fontSize:6,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase" as const,padding:"3px 10px",borderRadius:20,background:isComplete?"rgba(212,175,55,0.12)":v.status==="progress"?"rgba(100,220,100,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${isComplete?"rgba(212,175,55,0.4)":v.status==="progress"?"rgba(100,220,100,0.2)":"rgba(255,255,255,0.08)"}`,color:isComplete?"rgba(212,175,55,0.9)":v.status==="progress"?"rgba(120,220,120,0.8)":"rgba(255,255,255,0.2)"}}>
                  {isComplete?"✦ Open":v.status==="progress"?"◈ Soon":"○ Sealed"}
                </span>
              </div>
              {isComplete&&<div style={{position:"absolute",bottom:14,right:14,color:"rgba(212,175,55,0.5)",fontSize:16}}>→</div>}
            </div>
          );
        })}

        <div style={{marginTop:20,padding:"18px 18px",background:GF,border:`1px solid ${GB}`,borderRadius:18}}>
          <p style={{fontFamily:"system-ui",fontSize:7,fontWeight:800,letterSpacing:"0.4em",textTransform:"uppercase" as const,color:"rgba(212,175,55,0.55)",marginBottom:7}}>PHYSICAL SACRED CODEX</p>
          <p style={{fontFamily:"'Cinzel',serif",fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.85)",marginBottom:7}}>Order the Complete Printed Edition</p>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:12,color:"rgba(255,255,255,0.35)",lineHeight:1.6,marginBottom:14}}>Archival parchment · Gold foil stamping · Linen-bound hardcover.</p>
          <button style={{padding:"11px 26px",borderRadius:28,background:GF,border:`1px solid rgba(212,175,55,0.4)`,color:"rgba(212,175,55,0.85)",fontFamily:"system-ui",fontSize:7,fontWeight:800,letterSpacing:"0.35em",textTransform:"uppercase" as const,cursor:"pointer"}}>NOTIFY ME WHEN AVAILABLE</button>
        </div>
      </div>
    </div>
  );
}

 Diplomacy Adjudicator Test Cases table, th, td { border: 1px solid black; } th, td { padding: 4px; } 

DATC
====

DIPLOMACY ADJUDICATOR TEST CASES
--------------------------------

#### Copyright: Lucas B. Kruijswijk

### HISTORY OF CHANGES

| Version | Date | Name | Change |
| --- | --- | --- | --- |
| 1.0 | 2001-August-31 | Lucas B. Kruijswijk | First public version |
| 1.1 | 2001-August-31 | Flooey X. McBob | Added Test Cases 2.C, 4.E (renumbered following) |
| 1.2 | 2001-September-3 | Lucas B. Kruijswijk | Added Test Cases 2.C, 4.A, 4.B, 4.C, 4.D (renumbered following) |
| 1.3 | 2001-November-18 | Lucas B. Kruijswijk | Major update. Processed review comments from: Brian Roberts, Andrew Rose, Rick Desper, Simon Szykman and Millis L. Miller |
| 1.4 | 2001-November-24 | Lucas B. Kruijswijk | Added comments of Allan B. Calhamer on issue II.D |
| 2.0 | 2003-December-13 | Lucas B. Kruijswijk | Major update. Comments collected during year processed. Adjudication algorithm added. Chapters rearranged. Some small changes in preferences. Choices of issues now numbered instead of bulleted. |
| 2.1 | 2003-December-16 | Lucas B. Kruijswijk | Small textual changes after comments from David McCooey. Added unwanted support. |
| 2.2 | 2004-January-23 | Lucas B. Kruijswijk | Added note on DATC compliancy verification. Added test case 6.D.34, about support targeting own area. Small textual changes. |
| 2.3 | 2004-February-6 | Lucas B. Kruijswijk | Small textual changes after remarks from Christian Hagenah. Added version number. Changed license. Note on certification after change. Added issue 4.A.7 and test cases related to this issue. Added test 6.E.15, which the DPTG fails to adjudicate correctly. |
| 2.4 | 2004-February-10 | Lucas B. Kruijswijk | Corrected test cases 6.G.16, 6.G.17 and 6.G.18. |
| 2.5 | 2009-August-17 | Lucas B. Kruijswijk | Made a reference to "The Math of Adjudication" article of the Diplomatic Pouch. |
| 3.0 | 2024-February-23 | Lucas B. Kruijswijk | Updated according to 2023 rules. Preference of 6.G.8 and 6.G.11 changed. Test cases in 6.J changed, due to 2023 rule changes. Removed information about variants. Added test cases 6.B.15, 6.C.8, 6.C.9, 6.F.25, 6.G.19 and 6.G.20. |

Reviewed by:

* Flooey X. McBob
* Brian Roberts
* Andrew Rose
* Rick Desper
* Simon Szykman
* Millis L. Miller
* David McCooey
* Christian Hagenah
* Estaban U.C. Castro
* Ronnie van 't Westeinde
* David E. Cohen

You are allowed to call an adjudicator DATC compliant if all test cases of chapter 6 passes or deviations are done consciously.

License note: You are free to copy or use this document. When changing this document, this license must be included and the change log must be maintained. The test cases of chapter 6 are allowed to be copied separately without this restriction.

The main location where the latest version of this document is published is on [BoardGameGeek, Diplomacy, Files](https://boardgamegeek.com/boardgame/483/diplomacy/files).

Diplomacy is the Avalon Hill Game Company's trademark for its game of international intrigue, which game is copyright 1976 by Avalon Hill. Avalon Hill belongs to Hasbro.

### TABLE OF CONTENTS

[1\. INTRODUCTION](https://webdiplomacy.net/doc/DATC_v3_0.html#1)  
[2\. HISTORY OF RULES](https://webdiplomacy.net/doc/DATC_v3_0.html#2)  
[3\. SUGGESTIONS FOR FUTURE RULEBOOKS](https://webdiplomacy.net/doc/DATC_v3_0.html#3)  
[4\. DISPUTABLE ISSUES](https://webdiplomacy.net/doc/DATC_v3_0.html#4)  
    [A. CONVOY ISSUES](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A)  
    [B. COASTAL ISSUES](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B)  
    [C. UNIT DESIGNATION AND NATIONALITY ISSUES](https://webdiplomacy.net/doc/DATC_v3_0.html#4.C)  
    [D. TOO MANY AND TOO FEW ORDERS](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D)  
    [E. MISCELLANEOUS ISSUES](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E)  
[5\. THE PROCESS OF ADJUDICATION](https://webdiplomacy.net/doc/DATC_v3_0.html#5)  
    [A. OVERVIEW OF ADJUDICATION DECISIONS](https://webdiplomacy.net/doc/DATC_v3_0.html#5.A)  
    [B. PRECISE DESCRIPTION OF MAKING DECISIONS](https://webdiplomacy.net/doc/DATC_v3_0.html#5.B)  
    [C. FROM CONDITIONS TO ALGORITHM](https://webdiplomacy.net/doc/DATC_v3_0.html#5.C)  
    [D. THE TROUBLE WITH PANDIN'S PARADOX](https://webdiplomacy.net/doc/DATC_v3_0.html#5.D)  
    [E. THE PARTIAL INFORMATION ALGORITHM](https://webdiplomacy.net/doc/DATC_v3_0.html#5.E)  
    [F. THE GUESS ALGORITHM](https://webdiplomacy.net/doc/DATC_v3_0.html#5.F)  
[6\. TEST CASES](https://webdiplomacy.net/doc/DATC_v3_0.html#6)  
    [A. TEST CASES, BASIC CHECKS](https://webdiplomacy.net/doc/DATC_v3_0.html#6.A)  
    [B. TEST CASES, COASTAL ISSUES](https://webdiplomacy.net/doc/DATC_v3_0.html#6.B)  
    [C. TEST CASES, CIRCULAR MOVEMENT](https://webdiplomacy.net/doc/DATC_v3_0.html#6.C)  
    [D. TEST CASES, SUPPORTS AND DISLODGES](https://webdiplomacy.net/doc/DATC_v3_0.html#6.D)  
    [E. TEST CASES, HEAD-TO-HEAD BATTLES AND BELEAGUERED GARRISON](https://webdiplomacy.net/doc/DATC_v3_0.html#6.E)  
    [F. TEST CASES, CONVOYS](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F)  
    [G. TEST CASES, CONVOYING TO ADJACENT PROVINCES](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G)  
    [H. TEST CASES, RETREATING](https://webdiplomacy.net/doc/DATC_v3_0.html#6.H)  
    [I. TEST CASES, BUILDING](https://webdiplomacy.net/doc/DATC_v3_0.html#6.I)  
    [J. TEST CASES, CIVIL DISORDER AND DISBANDS](https://webdiplomacy.net/doc/DATC_v3_0.html#6.J)  

### 1\. INTRODUCTION

Writing an adjudicator computer program for the game Diplomacy is not an easy job. Prior to this document many adjudicator programs contained several bugs on their first release and even after some years, when the most severe bugs were removed, adjudication errors were still found for more complex situations. To achieve a high quality adjudicator, the programmer has to overcome the following difficulties:

* Different rulebooks.
* Ambiguities in the rulebooks.
* An algorithm that is sophisticated enough to handle complex situations.
* Systematic testing of the adjudicator.

This document is a guide in handling these problems and enabling the programmer to write an adjudicator that is correct on the first release.

The principle of this document is to give the reader information and not to tell the reader how to do things. Therefore, all information is presented as neutral as possible and given with arguments or with reference to the source.

The primary sources of this document are the official English rulebooks. The additional sources are the 1998 DPTG (Diplomacy Players Technical Guide), the Model House Rules (MHR) by David E. Cohen, comments from Mr. Calhamer (the creator of the game), magazines from the publishers of the game, various articles, discussions and house rules found on the internet. This makes this document the most elaborated and complete source on the rules of Diplomacy.

An overview of the official English rulebooks is given in chapter [2](https://webdiplomacy.net/doc/DATC_v3_0.html#2). The older rulebooks may differ on small issues with the most recent rulebook or are ambiguous on certain issues. These issues are listed in chapter [4](https://webdiplomacy.net/doc/DATC_v3_0.html#4) with the alternatives to handle them. An analysis of the process of adjudication is in chapter [5](https://webdiplomacy.net/doc/DATC_v3_0.html#5). Writing an adjudicator program is a straight forward job with this analysis. Finally, an adjudicator program needs to be tested in a systematic way and chapter [6](https://webdiplomacy.net/doc/DATC_v3_0.html#6) contains an extensive list of test cases with the expected resolution.

In case the rules are not clear on a certain situation (most of the issues are fixed in the 2023 rules), then the alternatives are in the list of issues and in the test cases. To prevent that the reader becomes lost in lots of choices I (Lucas B. Kruijswijk) commented every rule issue. Those comments contain my preference as to how the rule should be interpreted. In this way the reader can start with these preferences and deviate where he or she wishes. To make a clear distinction between the text that is not disputed and my comments with my preferences, my comments are written in _italics_. Note however, that my preferences are based on an extensive study on the rules. I tried to follow the consensus as much as possible and the choices are certainly very acceptable within the Diplomacy community.

With the elaborated information about the rules, this document can also be used by people who judge a game manually. The preferences can be used as default house rules in case the own house rules of the game master does not cover a certain topic.

The version of this document consists of two numbers. The first number will only change when one or more preferences changes. The second one is a sequence number.

### 2\. HISTORY OF RULES

Allan Calhamer started the development of Diplomacy in 1953. However, the first commercial version was not on the market before 1959. So, the first real rulebook is from 1959.

Games Research bought the rights of Diplomacy in 1960 and their first edition was in 1961. Except from some restyling and the copyright notice of Games Research, the rules of 1961 are not different from the 1959 rules. These rulebooks have many ambiguities and are rather useless. Dealing with the issues of these rulebooks is out of the scope of this document.

Most of the issues of the 1959 and 1961 rulebooks were identified and addressed in the 1971 rulebook. The 1971 rulebook is the first mature rulebook. Since this rulebook has been popular for a long time and maybe still people play according to these rules, the differences with newer rulebooks are all explained in this document.

In 1976 Avalon Hill bought the rights from Games Research. In their first edition in 1976, they kept the rules the same and they only put their own name on the rulebook. In this document, only to the first appearance of a set of rules is referred. That means that the 1971/1976 rulebooks are referred as the 1971 rulebook in this document.

In 1982 Avalon Hill made a new edition of the game and made some small, but significant changes to the rules. These changes include the multi-route convoy disruption rule (see issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)), convoy disruption paradox rule (see issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)) and some clarifications on convoying to adjacent provinces (see issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3)).

In 1992 Avalon Hill they introduced the 'Diplomacy de Luxe' edition. The rulebook was restyled, but the rules are identical to the 1982 rules. The rulebook does also contain a list of abbreviations for the provinces. Since, the rules did not change, the 1982/1992 rulebooks are referred as the 1982 rulebook in this document.

In 1998 Avalon Hill was bought by Hasbro and in 2000 the first Hasbro edition emerged. Note that you can see the year 2000 on the front page of the rulebook, however the copyright notice on the last page says 1999. Some people refer to these rules as the 1999 rules. In this document it is assumed that the front page is read more than the last page and therefore these rules are referred to as the 2000 rules. To make the rules more readable, the rules were completely rewritten. Edi Birsan was the main contributor to this rulebook. Aside from restyling, there are also some real changes to the rules. The unpopular 1982 convoy, disruption paradox rule (see issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)) was changed again. The issue on convoys to adjacent provinces was further clarified (see issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3)). Waiving builds is explicitly allowed (see issue [4.D.7](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.7)) and you can very well interpret the rules in such way that they do not allow the refusal of support by ordering an illegal order (see issue [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1)). Also, a significant change in the abbreviations of the provinces (note that the abbreviation of 'Denmark' is missing).

Unfortunately, there are a few changes in the 2000 rulebook that made things worse than the 1982 rules. A rather minor issue is the removal of units in civil disorder (see issue [4.D.8](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.8)). In the 1971 and the 1982 rulebooks this was already rather vague, but in the 2000 rules they made a real mess. A more serious error is that it was forgotten to say that a failed convoy due to dislodged convoying fleets, has no influence on the destination province. Page 12 of the 2000 rulebook:

> Dislodgement of a fleet in a convoy causes the convoy to fail. If a Fleet ordered to convoy is dislodged during the turn, the Army to be convoyed remains in its original province.

While rule XII.3 of the 1971 and 1982 rules say:

> DISRUPTING A CONVOY. If a fleet ordered to convoy is dislodged during the turn, the army to be convoyed remains in its original province and has no effect on the province to which it was ordered.

There are several reasons to assume that the 2000 rulebook was not intended like this and that this must be considered an error in the rules. First of all, Edi Birsan the main contributor to the 2000 rulebook, confirmed that this was not intended. Second, there is evidence in the rulebook itself that the rule should be read as the 1971/1982 rule. The whole page 16 would become unnecessary if convoying armies can still cut support when the convoy is dislodged (there are no paradoxes anymore). But especially the following phrase on that page is clear evidence:

> Italy could argue that dislodgement of the Fleet disrupted the convoy so that the Army could not arrive in Naples to cut the support. (Italy could state the rule, "Dislodgement of a fleet in a convoy causes the convoy to fail.")

Since in the research for this document no evidence was found that there is a significant group of people that actually play that a disrupted convoy can still cut support (or bounce another unit), this is not listed as a disputable issue in chapter [4](https://webdiplomacy.net/doc/DATC_v3_0.html#4), but just treated as an error and that the 1971/1982 rule was meant.

In 2008, a new version of the game was published by Wizards of the Coast (also bought by Hasbro), although the box still has the Avalon Hill brand. The rules were not changed except that the Denmark abbreviation was added. In this document they are still referred as 2000 rules.

In 2023, Renegade Games Studios took a license on the game and updated the rulebook fixing most ambiguities. The changes were mostly according to the preferences of version 2 of the DATC, but with the notable exception of disbanding units in civil disorder. It is now clearly specified, but not according to any older interpretation (see issue [4.D.8](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.8)). Unfortunately the issue of dislodged convoying fleets, that slipped into the 2000 rules, was not fixed.

Finally, there are numerous alternative rulebooks. For instance, the rulebook of the variant Colonial Diplomacy. This rulebook is based on the 1971 rules (although the copyright is after 1982). Furthermore, there are several translated rulebooks made for non-English versions of Diplomacy. These are not treated in this document. With the 2000 edition also a CD-ROM version was released by Hasbro/Avalon Hill/Microprose. This program has a tutorial for the rules. In the research of this document no additional information could be found about whether this version contains a paper rulebook and if it is any different from the rulebook supplied with the board game. So, obviously this version is not handled in this document and if it exists and it contains the 1999 or 2000 copyright notice, then we still refer to the rulebook of the board game when the 2000 rulebook is mentioned.

### 3\. SUGGESTIONS FOR FUTURE RULEBOOKS

_If the rulebook is ever be updated again, I have some suggestions._

_In the description of the "Order Writing Phase" on page 6 of the 2023 rulebook several sentences are used about legal and illegal orders. I think it is better to start with the assumption that players do everything according to the rules. I suggest to create a complete new separate chapter later in the rulebook with "Interpreting Orders". I think it is wise to add in that chapter info about legal/illegal adjustment orders. Such chapter could look like:_

> _When the submitted orders are revealed, the orders should be as executed as written and execution should not rely on clarifications of the submitter. It may happen once in a while, that an order set does not follow the rules properly. The following guidelines should be used for interpreting the orders:_
> 
> _Movement phase orders_
> 
> * _A legal order is an order that, not knowing any other orders yet, is possible. An impossible order, like "A Bohemia - Edinburgh", is illegal._
> * _Illegal orders are completely ignored and do not have any influence._
> * _A poorly written order that has only one meaning must be followed. However, orders should interpreted individually._
> * _If multiple different legal orders are given to a unit, all those orders become illegal._
> * _A unit without an order will execute a hold order and is able to receive support in hold. Support cannot be denied by an illegal move order, since illegal orders are ignored._
> 
> _Adjustment phase_
> 
> * _Adjustment orders are executed from top to bottom, skipping any orders that cannot be executed. This means that in case of too many build or disband orders only the first legal ones are executed._
> * _If insufficient disband orders are given, then a unit is automatically disbanded. etc._
> 
> _Civil Disorder_
> 
> _If a player leaves the game, the country is in civil disorder. Units will execute a hold order, not supporting each other, but able to receive support from other countries. Units are disbanded according to the procedure described earlier._

_The DATC examines way more issues regarding poorly written orders. However, I think they are from the era that games were played over the internet, but manually managed by a game master. Those situations are prone to players sending long complaints when a poorly written order was not executed as they intended. I think in a face to face game, one moves on. So, I think they should not be considered to be part of a rulebook._

_The rulebook doesn't use the Szykman rule for convoy paradoxes, while all modern adjudicators use this rule. I don't think there is a real problem in switching to this rule. The authors of the rulebook might want to avoid the word "paradox", although the word is already used in the rulebook. It can easily be worded as follows:_

> _If a situation arises concerning convoys attacking units ordered to support that does not have a solution or multiple solutions, then the convoying fleet(s) part of the situation will execute a hold order. The remaining units are resolved as normal after that._

_By targeting the convoying fleets (and not other units in the paradox, which may create difficulties to determine) not much can go wrong if adjudicated manually._

_Finally, for convoying to an adjacent province, I think it would be better to let the player always specify "via convoy". The current rules look also at the convoying fleets and is the only place where an order is interpreted by looking at other orders. I think, orders should be interpreted individually, as by poorly written orders. Also, it would simplify the wording of the rule and since it is a very special case, the player won't forget._

### 4\. DISPUTABLE ISSUES

Revealing the orders is an act that cannot be reversed. Adjudication should be based on the written orders, without clarification of the submitter. These facts can create dispute if it is not clear how to follow up on an order.

In this chapter the most known rule issues and issues in order interpretation are discussed. Note, that with the 2023 rules most adjudication issues are settled.

The geography of the map is not disputed and therefore not discussed. To surprise to some new players, Norway is connected to St Petersburg both for armies and for fleets, but this is not disputed. Although also not disputed, on some maps it is not completely clear, that Liverpool is connected to North Atlantic Ocean and Clyde is not connected to Irish Sea.

The issues in this chapter are not a FAQ (Frequently Asked Question) list, but most frequently asked questions can be found in the test cases. For instance, the coastal crawl in test case [6.B.13](https://webdiplomacy.net/doc/DATC_v3_0.html#6.B.13).

_After extensive study of the rules and discussions on the internet, my preferences are based on the following principles:_

_* To follow the latest official rulebook as accurate as possible. For the moment this means the 2023 rulebook.
* To follow the tradition of how Diplomacy is played.
* If the rules are not clear, the rules need fixing. The game does not need to be fixed or improved.
* To come up with clarifications that do not introduce new issues.
* Avoid surprising players by the adjudication.
* To make a choice that is reasonable for all ways of playing, especially face to face and on the web._

### 4.A. CONVOY ISSUES

#### 4.A.1. MULTI-ROUTE CONVOY DISRUPTION

When a convoy has multiple routes, the question arises as to when the convoy is disrupted.

The following interpretations are possible:

1.  The convoy is disrupted when one of the routes is disrupted.  
    This is according to the 1971 rulebook.
2.  The convoy is disrupted when all of the possible routes are disrupted.  
    This is according to any subsequent rulebook.

The 1971 rule has as disadvantage that a player that has a fleet that is almost certainly dislodged, can give an "unwanted convoy" as in test case [6.F.10](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.10). Also it is conceptually strange that adding an extra fleet to a convoy makes it weaker.

_I prefer choice b. There is no reason to opt for choice a and re-introducing the mentioned problems._

#### 4.A.2. CONVOY DISRUPTION PARADOXES

A convoy disruption paradox is a situation with a possible disrupted convoy and for which the rules give no resolution or more than one resolution.

Some people argue that some situations are not convoy paradoxes, since the rules give a resolution for those situations. Hence, for a proper discussion on paradoxes, rule XII.5 of the 1971, 1976, 1982 and 1992 rulebooks, the rule on the top of page 16 of the 2000 rulebook and rule on page 18 of the 2023 rulebook should not be taken into account in the above definition of a paradox.

In case of a paradox, the smallest subset of orders for which the paradox still exists, is the core of the paradox. In case there are several independent paradoxes on the board, then it is possible that there are two different subsets of orders with the same number of orders. In that case, just one can be taken to proceed. Since the paradoxes are independent it doesn't matter which one is handled first.

Different rulebooks rule differently:

1.  The 1971 rule about this issue is:  
    "If a convoyed army attacks a fleet which is supporting a fleet which is attacking one of the convoy fleets, that support is not cut."  
    This rule has a few drawbacks. The rule does not have a resolution for second order paradoxes (see test cases [6.F.22](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.22), [6.F.23](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.23), and [6.F.24](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.24)) and the betrayal paradox (see test case [6.F.18](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.18)). In some cases, it conflicts with the dislodge rule, although, the common interpretation is that this rule takes precedence (see test case [6.F.17](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.17)).
2.  The 1982 rule about this issue is:  
    "If a convoyed army attacks a fleet which is supporting an action in a body of water; and that body of water contains a convoying fleet, that support is not cut."  
    The advantage of this rule is that it is a simple and effective rule that eliminates all paradoxes. The disadvantage is that it effects not only the paradoxical situations, but also many other cases. This has as consequence that players can do tricks with this rule to take advantage (see test cases [6.F.20](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.20) and [6.F.21](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.21)). It is also not clear what a "convoying fleet" means. Does it mean a fleet that is ordered to convoy? Or must there be at least an army that tries to convoy? Or must there be a possible route? Finally, as with the 1971 rule, it conflicts with the dislodge rule in some cases, although, the common interpretation is that this rule takes precedence (see test case [6.F.17](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.17)).
3.  The 2000/2023 rule about this issue is:  
    "A convoyed Army does not cut the support of a unit supporting an attack against one of the fleets necessary for the army to convoy."  
    This rule is just a reversal of the 1982 rule back to the 1971 rule, but adapted for the changed multi-route convoy disruption rule (see issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)) which was introduced in the 1982 rulebook. This has as advantage that it leads to more logical adjudication in case of multi-route convoys (see test case [6.F.19](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.19)). It has also all disadvantages of the 1971 rule. So, the rule does not have a resolution for second order paradoxes (see test cases [6.F.22](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.22), [6.F.23](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.23) and [6.F.24](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.24)) and the betrayal paradox (see test case [6.F.18](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.18)). Also, in some cases it conflicts with the dislodge rule and again the common interpretation is that this rule takes precedence (see test case [6.F.17](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.17)).

Due to the incompleteness of the paradox rules, several alternatives or additions has been proposed over the years:

4.  The 'All Hold' backup rule:  
    "If a situation arises in which an army's convoy order results in a paradoxical adjudication, all the moves part of the paradoxical situation fail."  
    The rule cannot replace the existing rules without breaking tradition, because it gives a different adjudication for the simplest paradox (see test case [6.F.14](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.14)), while that paradox might happen in actual play. Having the rule as backup rule means that one has to deal with two paradox rules. Furthermore, it is not entirely trivial to determine which moves belong to the paradox. With new adjudicators opting for the Szykman rule, the 'All Hold' rule lost its popularity and will not be discussed further.
5.  Some ideas looked at what the convoying army "causes" and specifically on itself. However, those attempts lacked precision and understandability.
6.  Simon Szykman alternative (reworded):  
    "If a situation arises in which an army's convoy order results in a paradoxical adjudication, the convoying fleet(s) part of the paradox will execute a hold order."  
    This rule was proposed by Simon Szykman in a discussion with Manus Hand in the Diplomatic Pouch Zine (1999, Fall Retreat). Simon defended his rule, while Manus Hand defended the 1982 rule. The Szykman rule is mostly compatible with the 2000/2023 rulebook and has a resolution for all paradoxes. Only in a case where the convoying army dislodges a unit (see test case [6.F.17](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.17)) is the result different. Originally, the rule was different formulated targeting the convoying army. However, there is probably just one fleet with a convoy order. If adjudicated manually the reworded alternative can hardly be misinterpreted, just take out the fleet with the convoy order.

All adjudicators written after the inception of the DATC opted for the Szykman rule.

_I prefer the Szykman rule, because of the given advantages and especially compatibility with the official rules._

#### 4.A.3. CONVOYING TO ADJACENT PROVINCE

It is allowed to convoy to an adjacent province. This can be used to swap two units. If the units are ordered in such way that a convoy to an adjacent province is possible, the question arises whether the convoy route must be considered or the land route. This is relevant, because the success of the move may depend on it. A foreign power may order such convoy "unwanted" to trick an opponent with a swap or to disrupt the move.

Relevant test cases are in section [6.G](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G). See further related issue [4.A.5](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.5)

The rules about this evolved over time.

1.  The 1971 rulebook only says that swapping via a convoy is possible. "Two pieces may exchange places if either or both are convoyed."  
    It is common to reduce the possibility of an unwanted convoy by only considering the convoy route if the unit at the destination moves in opposite direction. One can even take a step further and require that the convoy is not disrupted. In this document it is assumed that this indeed how the 1971 rules should be adjudicated.
2.  The 1982 rulebook is more elaborate. "If an army could arrive at its destination either overland or by convoy, one route must be considered and the other disregarded, depending on intent as shown by the totality of the orders written by the player governing the army."  
    If there is just one foreign fleet available for convoy and the units that want to swap are not of the same power, then there is no order set that results in a swap.
3.  The 2000 rulebook and 2023 rulebook are identical on this issue and introduce the tag "via convoy" indicating that the order must use the convoy. "In some rare cases, orders are written so that an Army could arrive at its destination either by land or convoy. When this happens, the following qualifiers apply: • If at least one of the convoying Fleets belongs to the player who controls the Army, then the convoy is used. The land route is disregarded. • If none of the convoying Fleets belongs to the player who controls the Army, then the land route is used. However, the player controlling the Army can use the convoy route if he or she indicated 'via convoy' on the Army move order in question. This prevents foreign powers from kidnapping an Army and convoying it against its will."

For the 2000/2023 rule the phrase "could arrive" is ambiguous. Does it mean that there is an undisrupted convoy, or a convoy is ordered covering the whole path? So, should the land route be a fallback?

_In the DATC version 2 this fallback was my preference. However, given the feedback I received in the years, I now think there should be no fallback. So, if ordered with "via convoy" or there is a fleet of the same country legally ordered to convoy, only then the convoy route should be considered._

The DPTG requires that convoying to an adjacent province is always tagged with 'by convoy' (it uses 'by' instead of 'via'). Note, compared with the 2000/2023 rules this only a difference in order writing and not in game mechanics.

_For a future rulebook, I prefer the DPTG way. This the only place where an order is interpreted by looking at other orders (see also issue [4.E.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.2)). By eliminating this, the text is also simplified. Convoying to adjacent province is something rare and something that a player does consciously. There is no reason that the player will forget "via convoy"._

#### 4.A.4. SUPPORT CUT ON ATTACK ON ITSELF VIA CONVOY

A move cannot cut a support, if the support is a support of an attack on itself. But what if the move is via convoy (see test case [6.G.13](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G.13))?

Note, if a convoy to an adjacent province can only take place when the unit moves in opposite direction (the 1971 rules for issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3)), then this issue is not relevant anymore. Then the moving unit will take the land route and the support will not cut.

The following two interpretations are possible:

1.  The support is not cut.
2.  The support is cut.

The main issue is the interpretation of the word 'from' as used in the rulebook. If 'from' is interpreted as the starting position of the army being convoyed, then the support is not cut. However, if the attack is coming 'from' the body of water, then the support is cut.

This has been discussed on the usenet group 'rec.games.diplomacy' and on the 21th November 2001 Randy Hudson and Mike Lease gave the following arguments why 'from' should be interpreted as the starting position of the army:

> It's not phrased as a clarification of the "cutting support" rule (Rule X) in the 1976 rules. I've now printed out a copy of the 2000 rules from the Hasbro web site, and in the explanation, it offers the example:  
>   
> France: A Tun-Nap, F Tyn C A Tun-Nap  
> Italy: F Ion-Tyn, F Nap S F Ion-Tyn  
>   
> The explanatory text goes on to say that France could argue that support is cut (thus preventing the convoy from being disrupted), citing the rule, "Support is cut if the unit giving support is attacked from any province but the one where support is being given." IOW, since the army is coming from Tunis, it would normally be entitled to cut the support for F Ion-Tyn given by Naples, thereby preventing the convoy from being disrupted. This "new rule" (author's words) gives an exception to that rule, overriding the usual rule and eliminating the paradox. This rule WOULD NOT BE NECESSARY if the army were deemed to be coming from Tyn (the space being attacked). But the author says it IS NECESSARY ("...this rule takes precedence" \[over the usual rule that would apply\]), therefore, the army MUST be deemed to come from Tun, and this rule exists to provide an exception to avoid paradox. But it only applies to a situation in which a convoy would be disrupted if the support is effective, but not disrupted if the support is ineffective. Therefore, for all other convoys, the ordinary interpretation should be that the army is deemed to come from the province in which it began the turn, and thus an army which can reach a province either via land or via convoy cannot cut support for an action against the province in which it started the turn, whether or not it is convoyed to the supporting unit's province. QED.

Stephen Agar sent this problem to Allan Calhamer (the creator of Diplomacy). Before he got a response he followed up with the arguments of Randy Hudson and Mike Lease. On the 24th of November 2001, Allan Calhamer responded:

> Good argument. I had always thought of the Army as coming from its province, not from the body of water, but your correspondent appears to show actual rule support for the proposition.  
> Best regards, Allan

So, according to the creator the attack is coming from the starting position of the army.

However, you can have also another view on this issue. If you look to support as something that is passing a border, then the support is not cut when the attack and support are clashing on the same border. In case of a convoy, there is no such clash, so it would be more logical to say that the support is cut (choice b). Taking this border point of view, it would be preferred that the choice is consistent with issues [4.A.5](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.5) and [4.A.7](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.7).

_Of course, I follow the interpretation of the creator. Therefore, I prefer that the support is not cut (choice a)._

#### 4.A.5. RETREAT WHEN DISLODGED BY CONVOY

In a very rare situation (see test case [6.H.11](https://webdiplomacy.net/doc/DATC_v3_0.html#6.H.11) and [6.H.12](https://webdiplomacy.net/doc/DATC_v3_0.html#6.H.12)) a unit can be dislodged by a convoy from an adjacent province. Then the question arises whether the dislodged unit may retreat to the starting province of the convoyed army.

The following two interpretations are possible:

1.  The unit may not retreat to the starting province of the attacker.
2.  The unit may retreat to the starting province of the attacker when the attack was with convoy.  
    This is according to the 2023 rulebook.

First note that if issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3) is played according to 1971 rules, then this issue can only occur in the extremely theoretical situation that both units attempted to move by convoy (see test case [6.H.12](https://webdiplomacy.net/doc/DATC_v3_0.html#6.H.12)).

The 2023 rulebook explicitly allows this, while older rulebooks were ambiguous on this.

_There is no reason to deviate from the 2023 rulebook. So, I prefer choice b._

#### 4.A.6. CONVOY PATH SPECIFICATION

Some early automated email judges required that a path was specified for the army that convoys. For instance:

England: 
F North Sea Convoys A Yorkshire - Belgium
A Yorkshire - North Sea - Belgium 

This way of writing convoys has never been part of the official rules.

The advantage of path specification is that "unwanted" convoys are not possible. There are four types of "unwanted" convoys:

* An unwanted multi-route convoy to prevent convoying.  
    This is only possible with the 1971 rules where a multi-route convoy is disrupted when one of the routes is disrupted (see issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)). If a fleet is almost certainly dislodged, the player can anticipate a convoy of the enemy and give the fleet the order to convoy the army of the enemy. See also test case [6.F.11](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.11).
* An unwanted multi-route convoy to take advantage of the paradox rule.  
    This is only possible with the 1982 paradox rule (see issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)). If a support of a fleet on another fleet is almost certainly cut by a convoy, the player can give the other fleet a convoy order to prevent dislodgement. See also test case [6.F.20](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.20).
* To kidnap an army.  
    A player ordering a convoy of a foreign army to an adjacent province to make it a swap instead of a standoff. This to get a unit behind enemy lines or just to make a joke (see test case [6.G.2](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G.2)).
* To let a convoy succeed that would otherwise fail.  
    A situation is possible that a player is betrayed when a convoying fleet is dislodged. In such case the player might want that the convoy fails, because of a better defense position. The enemy can prevent this by ordering an alternative convoy route. See also test case [6.F.13](https://webdiplomacy.net/doc/DATC_v3_0.html#6.F.13).

The first three unwanted convoys are not possible with the 2000/2023 rulebook. So, the argument of preventing unwanted convoys is hardly valid.

This issue can be handled in the following ways:

1.  Path specifications are not allowed and if they are ordered then they are ignored.
2.  Path specifications are allowed but not required.
3.  Path specifications are required. The convoy fails if the order does not contain the path.

_Path specification is something from the past. Modern adjudicators don't require it anymore. So, my preference is choice a._

#### 4.A.7. AVOIDING A HEAD-TO-HEAD BATTLE TO BOUNCE A UNIT

The rulebooks say that if a unit is dislodged, then it has no influence on the area where the attacker came from. Of course, this is only significant when the units move in opposite direction. However, when two units move in opposite direction, they are not necessary engaged in a head-to-head battle. It is possible that one of the units convoys. The question arises, whether the dislodged unit can still bounce a third unit. See also test case [6.G.10](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G.10), [6.G.14](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G.14) and [6.G.15](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G.15).

The following interpretations are possible:

1.  A dislodged unit has never effect on the area where the attacker departed from.  
    This is the literal interpretation of the rulebook. It can be properly adjudicated, but the adjudication is confusing (see also [5.B.6](https://webdiplomacy.net/doc/DATC_v3_0.html#5.B.6)).
2.  A dislodged unit has only no effect on the area where the attacker departed from, when it was engaged in a head-to-head battle.  
    This resolution is more natural, because while the unit was being dislodged it was simultaneously engaged in a fight with the third unit and bouncing it. From the rulebook point of view, it can be defended by saying that swapping two units with a convoy, is a special rule which is an exception to the other rules. This exception also includes the possibility of bouncing a unit, even when it is dislodged.

_Although choice a is more according to the rulebook, I think choice b is how it is intended. Therefore I prefer choice b. This choice is also consistent with choice b of issue [4.A.5](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.5), where we really look what is passing the border, instead of looking where the unit comes from._

### 4.B. COASTAL ISSUES

#### 4.B.1. OMITTED COAST SPECIFICATION IN MOVE ORDER WHEN TWO COASTS ARE POSSIBLE

If a move order of a fleet to a multi-coast area does not contain a coast where the fleet can move to both coasts, then the move should fail.

Email judges in the early days of internet Diplomacy used a default coast. However, this principle was never used in face to face Diplomacy (which coast should be taken?).

#### 4.B.2. OMITTED COAST SPECIFICATION IN MOVE ORDER WHEN ONE COAST IS POSSIBLE

If a move order of a fleet to a multi-coast area does not contain a coast where the fleet can only move to one coast, the following interpretations are possible:

1.  A move is attempted to the only possible coast.
2.  The move fails.

_Omitting the coast can be regarded as a poorly written order which needs to be followed. So, choice a._

#### 4.B.3. MOVE ORDER TO IMPOSSIBLE COAST

If a move order of a fleet to a multi-coast area does contain a coast but the specified coast is not possible, different adjudicators may react differently.

The following interpretations are possible:

1.  The coast is ignored and a move is attempted to the possible coast.
2.  The order is considered illegal.

_I do not like the idea of changing an unambiguous order. Therefore, I prefer that the order is declared illegal (choice b)._

#### 4.B.4. COAST SPECIFICATION IN SUPPORT ORDER

Even the rulebook of 1959 allowed that a fleet can support another fleet to a coast which it cannot reach (a fleet in Greece can support a fleet from the Black Sea to the east coast of Bulgaria). However, for a long time it was disputed whether the coast must be specified in the support order. The 1971/1982/2000 rulebooks do not clarify this.

The creator Allan Calhamer commented on this issue (usenet rec.games.diplomacy, August 29th 2002):

> Stephen Agar wrote:  
>   
> Allan  
>   
> Could you spare the time to give your view on how to adjudicate the following situations - as you can see they all depend on how you treat the coast designations in each situation.  
>   
> Turkey: F Con-Bul(ec)  
> Russia: A Rum S Turkish F Con-Bul(sc)  
> Austria: A Bul Holds  
>   
> Turkey: F Con-Bul(ec)  
> Russia: A Rum S Turkish F Con-Bul  
> Austria: A Bul Holds  
>   
> Turkey: F Con-Bul(ec); A Rum S F Con-Bul  
> Austria: A Bul Holds  
>   
> Many thanks.  
> PS. The next issue of Armistice Day is in the post - hope you like the cover!  
>   
> Regards  
>   
> Stephen Agar  
>   
> Dear Stephen: I would consider the supports in the first two cases no good, since I think allies should be in evident agreement on the moves. The support in the third case I would consider good.  
>   
> Best regards, Allan

Since this comment it has slowly become the consensus that coastal specification in a support order must be possible. This view has also been adopted by the 2023 rulebook by explicit mentioning it.

One can still discuss what should happen if the coast is omitted. Calhamer's position this is only valid when the unit is of the same power. This means that the support order was a kind of poorly written order and that it is interpreted by the other order.

_Interpreting orders by looking at other orders in the same order set is something I don't like. It opens all kinds of new discussions._

Alternatively, one could just allow that the coast is not specified in the support order even if the fleet is of different power (deviating from Calhamer''s position). In such case there is no poorly written order, because it is just allowed.

_In case the game is played where the orders are directly checked when submitted, such as a webbased system, I prefer that only support orders with coast specification are admissible. However, in case the orders are only checked on adjudication, such as in face to face play, I think it is a little bit harsh to reject such support order, even when it is not of the same power. I think it is a little bit far-fetched that a player would trick another player requesting such support order (Sure, I will move to north coast, but please don't specify coast in your support order)._

#### 4.B.5. WRONG COAST OF ORDERED UNIT

How should an order directed to a fleet on the north coast be executed when the fleet is actually on the south coast?

The following interpretations are possible:

1.  The move fails.
2.  Such coast specification is just ignored.

_I prefer that such garbage in the orders is just ignored (choice b)._

#### 4.B.6 UNKNOWN COASTS OR IRRELEVANT COASTS

How should an order be executed that contains an unknown coast, such as Spain west coast or Brest east coast. And how should an order be executed when the coast is just irrelevant, such as an army movement to the north coast of Spain?

The following interpretations are possible:

1.  The move fails.
2.  Such coast specification is just ignored.

_I prefer that such garbage in the orders is just ignored (choice b)._

#### 4.B.7. COAST SPECIFICATION IN BUILD ORDER

When a fleet is built in multi-coast area (St Petersburg), the coast must be specified. When the player does not specify the coast, the build must be fail.

### 4.C. UNIT DESIGNATION AND NATIONALITY ISSUES

#### 4.C.1 MISSING UNIT DESIGNATION

When the designation of the type of a unit (A or F) is omitted, the following could be decided:

1.  The order is invalid (the unit can receive hold support).
2.  The order is still valid.
3.  The order is still valid unless there is another order with the correct designation of the unit (the order with the missing designation is ignored).  
    The problem of this choice is that the other order might be unclear for another reason.

_Since the order is not ambiguous, I prefer that the order is still valid (choice b)._

#### 4.C.2. WRONG UNIT DESIGNATION

When the designation of the type of a unit (A or F) does not match with the actual type of the unit, the following could be decided:

1.  The order is invalid (the unit can receive hold support).
2.  The order is still valid.
3.  The order is still valid unless there is another order with the correct designation of the unit (the order with the wrong designation is ignored).  
    The problem of this choice is that the other order might be unclear for another reason.

_I think a best effort should be made to interpret the order, therefore I prefer that the order is still valid (choice b). This means that the unit type designation is in fact ignored. You can argue whether the unit type designation has any use. However, if other parts of the order are unclear, the unit type designation might help._

#### 4.C.3. MISSING UNIT DESIGNATION IN BUILD ORDER

A player might forget to specify whether it wants to build an army or a fleet. Such situation can be handled in the following ways:

1.  The build fails always.
2.  The build fails for coastal areas, but an army is built when the build is ordered in a land area.
3.  An army is built in a land area and a fleet is built when the build is ordered in a coastal area and a coast is specified. When no coast is specified, the build fails.

_I prefer that a best effort is made. Therefore, I prefer that the order only fails when the area is coastal area and the order did not contain a coast (choice c)._

#### 4.C.4. BUILDING A FLEET IN A LAND AREA

A player might try to build a fleet in an province that cannot contain fleets. Such situation can be handled in the following ways:

1.  The build fails always.
2.  An army is built on the specified province.

_First of all, I do not consider such order ambiguous. Second, if it has to be changed, there are alternatives. The player may want a fleet on another province or the player may want to waive the build instead. Since this cannot be concluded based on the given order, I prefer that the build fails (choice a)._

#### 4.C.5. MISSING NATIONALITY IN SUPPORT ORDER

When the designation of the nationality of supported or convoyed foreign unit is omitted, the following could be decided:

1.  The order is invalid.
2.  The order is still valid.
3.  The order is still valid unless there is another order with the correct designation of nationality (the order with the missing designation is ignored).  
    The problem of this choice is that the other order might be unclear for another reason.

Note that there are adjudicators that cannot parse the nationality in support orders.

_Specifying the nationality in support orders is a rule that is often ignored. I prefer that the order is just valid (choice b)._

#### 4.C.6. WRONG NATIONALITY IN SUPPORT ORDER

When the designation of the nationality of supported or convoyed foreign unit is incorrect, the following could be decided:

1.  The order is invalid.
2.  The order is still valid.
3.  The order is still valid unless there is another order with the correct designation of nationality (the order with the incorrect designation is ignored).  
    The problem of this choice is that the other order might be unclear for another reason.

Note that there are adjudicators that cannot parse the nationality in support orders.

_I think a best effort should be made. Therefore, the order should just be valid (the second option). This means that the nationality is in fact ignored (choice b). You can argue whether the nationality has any use. However, if other parts of the order are unclear, the nationality might help._

### 4.D TOO MANY AND TOO FEW ORDERS

#### 4.D.1. MULTIPLE ORDER SETS WITH DEFINED ORDER

If a game is played by email or by post, the game master (or automated judging system) may receive multiple order sets. Of course, if it is a clear what the latest order set is, then the latest order set replaces any previous order sets. However, if the latest order set is incomplete, it could be handled in the following two ways:

1.  All order sets are combined to one set of orders.
2.  All order sets are combined to one set of orders, unless it is clear that the latest order set replaces all earlier sets.
3.  Only the latest order set is considered, unless it is clear that earlier sets must still be taken into account.
4.  Only the latest order set is considered.

_In principle this is something that should be handled in the house rules. However, when it is not handled in the house rules, then I think the interests of both players and judge are best served when in principle a new set replaces an old set and only earlier sets are taken into account when it is clear from the order set (choice c)._

#### 4.D.2. MULTIPLE ORDER SETS WITH UNDEFINED ORDER

Also, in face to face games strange things can happen. When two sets of orders are submitted in a face to face game, then it is probably not clear which order set is the latest one. The following could be decided:

1.  All units hold.
2.  All order sets are combined to one set.

_I think a best attempt should be made to interpret the orders. Therefore, I prefer that all orders sets are combined (choice b)._

#### 4.D.3. MULTIPLE ORDERS TO THE SAME UNIT

It might also occur that a player orders a unit twice or even more, with at least two orders that are not the same (if the orders are the same, then it should just follow that order). This situation is not covered by any rulebook and only in house rules.

First of all, it should be decided what should be treated as order. This is discussed in issue [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1). Any illegal order should be ignored. That means that if a unit gets a legal and an illegal order, then there are in fact no multiple orders and only the legal order should be handled. This may sound theoretically, but this is exactly what can happen when someone swaps two names in a support order.

The following interpretations are possible:

1.  The first order is used.
2.  The last order is used.
3.  The order is illegal and changed in a hold order (able to receive a hold support)

Note that this is only an issue when the two orders are in the same order set. In case of multiple order sets see issue [4.D.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.1) and [4.D.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.2).

_A player can have many units. In a face to face game, it might not be that clear which order is first (if multiple papers are used or when the player uses columns). Therefore, I prefer the last interpretation (choice c). However, for an automatic adjudicator program another solution might fit better with the user interface._

#### 4.D.4. TOO MANY BUILD ORDERS

It might occur that a player orders too many builds. The rulebooks do not give a solution to this specific situation.

The following interpretations are possible:

1.  All build orders are invalid.
2.  The first legal build orders are used.
3.  The last legal build orders are used.

Note that this is not an issue when the build orders are in different order sets. In case of multiple order sets see issue [4.D.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.1) and [4.D.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.2).

_I have taken part in a face to face game where this happened. France ordered three builds in 1901 while he was allowed to build only two units. If all builds were denied, then it would not only ruin the game for the player of France, but also for all other players. Therefore, I prefer that the first legal orders are used (choice b). Although, in case of an automatic adjudicator, another solution might fit better with the user interface._

#### 4.D.5. MULTIPLE BUILD ORDERS FOR ONE PROVINCE

Each area can have only one unit. This makes an order for building both fleet and army in one and the same province illegal.

The following interpretations are possible:

1.  Both build orders fail.
2.  The first build order is used.
3.  The last build order is used.

Note that this is not an issue when the build orders are in different order sets. In case of multiple order sets see issue [4.D.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.1) and [4.D.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.2).

_Comparable to too many build orders, I prefer that adjustments orders are just executed one by one. So, I prefer that the first build order is used (choice b)._

#### 4.D.6. TOO MANY DISBAND ORDERS

Comparable with the situation that a user orders too many build orders, a player can also order to many disband orders. The different rulebooks do not give any answer how to handle such situation.

The following interpretations are possible:

1.  All disband orders are handled according to the civil disorder rules.
2.  The first legal disband orders are used.
3.  The last legal disband orders are used.

Note that this is not an issue when the disband orders are in different order sets. In case of multiple order sets see issue [4.D.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.1) and [4.D.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.2).

_I prefer that it is handled similar to the situation where too many build orders are given. So, I prefer that the first legal disband orders are used (choice b). Although, in case of an automatic adjudicator, another solution might fit better with the user interface._

#### 4.D.7. WAIVING BUILDS

The 1971 and 1982 rulebooks are ambiguous about waiving builds. Two interpretations are possible:

1.  Waiving builds is allowed.  
    This is according to the 2000/2023 rulebook which explicitly specifies that a build can be waived: "A country can decline to build a unit that it is entitled to for whatever reason (usually a diplomatic one)."
2.  Waiving builds is not allowed.  
    The disadvantage of not allowing to waive builds is that additional rules are required when someone forgets to build

Note that if the game is played by email or by post, it may require that the build is explicitly waived. In this way the waiving of builds can be distinguished from no orders received. This is not an issue in face to face games.

_With the 2000/2023 rulebook this is not really an issue anymore. So, I prefer choice a._

#### 4.D.8. REMOVING A UNIT IN CIVIL DISORDER

The rulebook prior to 2023 specifies which unit must be removed when a country in civil loses a supply center. However, the way it is described allows multiple interpretations.

In the 1971 and 1982 rulebooks, the distance of each unit to the home supply centers must be calculated. The distance must be calculated by "the shortest available route, including convoys". This allows multiple interpretations. Must fleets be available for convoying? And must convoys be calculated as one move? Or should we allow armies and fleets to use land and sea?

The 2000 rulebook is even more vague about this. The distance must be calculated to the "country". The term 'home supply centers' is not used. Taking the word 'country' literally means that also some provinces without supply center must be taken into account (for example, Apulia as part of Italy). Furthermore, information how the distance should be calculated is also less clear then the in the 1971 and 1982 rulebooks (the word 'convoy' is not used). Implementing this in adjudicator would require a lot of work, because map data needs to be extended with the country information. Also, for variants country might not be clear at all.

Prior to the 2023 rulebook (and version 2 of the DATC) the most common way to calculate distance was that fleets move regularly, while armies could also walk over water.

The 2023 rulebook fixes it, but also changes it. Distance is calculated where both armies and fleets can take both land and sea. But distance is not calculated to home supply center, but to the nearest owned supply center.

_Previous versions of the DATC detailed out many different ways of removing a unit. With the 2023 rulebook those are not important anymore._

If two distances are the same, then the alphabetical order of the areas becomes significant. This raises the issue of the language that should be used. For instance, a dispute may arise when a non-English board is used, but English versions of conference maps and rules were downloaded and printed from the internet.

_I prefer that the English language is used by default. However, if the game is played face to face with one or more physical boards (conference maps and rulebooks not taken into account) and those boards are all in the same language, then I prefer that the language of those boards be used. In such case, a list of English names might not be available. If the game is not played face to face and played completely in another language then English, then I still prefer that the English language is used. A computer program might have an user interface without any single English word, internally it still may use English names, for instance in a communication protocol. To avoid trouble here, the default language is English and the exception is only in the case of face to face games. Furthermore, in a game that is not face to face, the availability of a list with English names is probably not an issue._

#### 4.D.9. RECEIVING HOLD SUPPORT IN CIVIL DISORDER

When a country is in civil disorder, all its units hold and do not support each other. But what should happen when another country supports the hold of one of the units?

The following interpretations are possible:

1.  The support fails.  
    This means that there is a difference between an unordered unit and a unit of a country in civil disorder. This has as consequence that a new issue is introduced. When is a country exactly in civil disorder? In a face to face game this might not be that clear!
2.  The support succeeds.  
    You may argue that this is just according to the official rules. Since a unit that is not ordered to move may receive support to hold.

_I see no reason for introducing new issues for this rather insignificant issue. Therefore, I prefer that the support succeeds (choice b). Also, in a face to face game, a support to hold the armies, as an act of good will, might end the civil disorder._

### 4.E. MISCELLANEOUS ISSUES

#### 4.E.1 ILLEGAL ORDERS

Which writing should be regarded as an order has long been a controversial item. Is a move like "A Moscow - Munich" legal, or should it be totally ignored? There is one specific situation where this is not just an order writing issue, but a mechanic in play. If a player wants to deny a support, then the player could consider an impossible move. This would only make sense if the player wants to disband an unit to build it somewhere else. For this tactic the help of another power is needed to dislodge it. But a third power might interfere by giving a support in hold.

This is a far-fetched situation, but there are other situations in order writing where the legality of an order is relevant. Suppose Germany orders the following:

F Kiel Hold
A Holland Supports Kiel 
A Holland - Picardy

The Germany player intended to write "Belgium - Picardy" for the third order, but by accident wrote "Holland" with as consequence that Holland has two orders. One could say that Holland holds due to the confusion and does not give support to Kiel. However, one could also argue that the third line should entirely be ignored since Holland to Picardy is impossible.

The 2023 rules make an end to this discussion. Impossible orders result in an hold (better would have been if it said "ignored" and without order it would hold). However, the rules fail to define precisely to term "valid" and "legal".

In the DATC a "valid" order is an order according to the rules and in case of support or convoy it must match. If a move order requires a convoy, the move is only valid when a convoy path is ordered. A legal order is an order that, not knowing any orders yet, could be valid. In case of a support, the support should be possible to be valid at the same time (see test case [6.D.31](https://webdiplomacy.net/doc/DATC_v3_0.html#6.D.31)). Also a convoy order for which the fleet is not necessary for any convoy route is illegal (see issue [6.G.19](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G.19)). An illegal order should be completely ignored (and if the unit does not receive another order it will hold).

This is roughly consistent with how these terms are used in the rulebooks. It is recommended to use these terms also in the adjudicator. A non-matching order should be labeled "invalid" or "void", but not "illegal" or "cancelled".

The advantage of restricting legal orders as much as possible is that takes away any other discussion. If an impossible move would be allowed to refuse a hold support, when is it still considered an order, "A Moscow - Moon"?

In one mode of playing the legality of orders is very significant. If the players cannot communicate with each other ("no-press" variant) then orders are also used to signal other players intent. With the most restrictive definition of legal, the way of communication is limited

#### 4.E.2. POORLY WRITTEN ORDERS

A poorly written order is a certainly to happen. The 1971 and 1982 rulebook say (page 3): "A badly written order, which nevertheless can have only one meaning, must be followed". The 2000/2023 rulebook uses only a different term and formulation: "A poorly written order that has only one meaning must be followed".

Interpreting those orders is up to the players when it occurs. However, one thing could be considered upfront:

1.  All orders should be judged individually.
2.  Orders of one player should be judged as a set. Meaning, that one order may clarify another.

_I think looking at other orders opens a box of pandora, so my choice is a._

_In issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3) a convoy to adjacent province can be made clear by the convoy of a fleet of the same country. This is a kind of clarification of one order by another and I don't like that._

_Similar in issue [4.B.4](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.4), if coast specification in a support order is not necessary for own unit, but required for a foreign unit, then again one order clarifies the other._

#### 4.E.3. IMPLICIT ORDERS

An implicit order is an order that is deduced from a support order or convoy order. For instance, when Germany orders its army in Ruhr to support a move from Kiel to Holland, then the move order from Kiel to Holland can be deduced as implicit order. It can be decided that:

1.  Implicit orders are allowed.  
    Note that an explicit order takes precedence over an implicit order. And a implicit order can never be deduced from orders from another player.
2.  Implicit orders are not allowed.

_I think that allowing implicit orders encourages incomplete order sets and that this will lead to more problems and errors. Therefore, I prefer that implicit orders are not allowed (choice b)._

#### 4.E.4. PERPETUAL ORDERS

When a player wants to quit the game, he maybe wants to give 'Perpetual Orders'. That are orders that will be repeated every turn. For instance, when Italy still has two armies in Portugal and Spain, he may want to give the order that they will mutually support each other as long as it is possible. It can be decided that:

1.  Perpetual orders are allowed.
2.  Perpetual orders are not allowed.  
    Since the rulebook contains special rules for a country in civil disorder, it can be argued that perpetual orders are not allowed according to the rules.

_Although I do not really object against perpetual orders, I think allowing perpetual orders should be decided before the game is started or all players should agree during the game. If it was not explicitly allowed and a player wants to give perpetual orders and another player opposes, then I prefer that it is not allowed (choice b)._

#### 4.E.5. PROXY ORDERS

A 'Proxy Order' is an order that one does not order a specific unit by oneself, but that another specific player may give the actual order to the unit. I can be decided that:

1.  Proxy orders are allowed, where the player should notify the judge that it wants to proxy a unit. This notification is before the submission of the orders and the player that receives the proxy has knowledge about it.  
    This type of proxy order, does really change the game. In this way a player can get certainty about the order of a foreign unit, while part of the game is that players have never full certainty about the orders of other players.
2.  Proxy orders are allowed where a proxy order is given as part of the normal order set.  
    This type of proxy orders may look as a rather harmless way of speeding up the negotiations (and therefore the game). However, it is not that simple. Without proxy orders, a player will never give an order that is not in his or her own interest. With proxy orders, the player can be betrayed and his own unit can be moved out of position. See also the remark from the creator of the game, Allan Calhamer, on issue [4.B.4](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.4) "I think allies should be in evident agreement of the moves." One could argue that in case there is no full trust, one should not give a proxy order. Again, it is not that simple. One player could demand from another player a proxy order and threaten that any other order would be interpreted as a sign of distrust. If proxy orders are not allowed, this cannot happen. As you can see, this is an excellent example how procedures can have effect on politics. For this reason, you cannot sell your own vote in an election, although it is your own vote. Furthermore, for this reason the law does not allow that a president or minister delegates certain powers.
3.  Proxy orders are not allowed.

_A player that proposes to allow proxy orders, during the game, may have a complex diplomatic plan. Therefore, I think proxy orders should only be allowed when this has been decided before the game started. Since, proxy orders are not according to mechanics of order writing as described in the rulebook, they should not be allowed by default (choice c)._

#### 4.E.6 FLYING DUTCHMAN

A 'Flying Dutchman' is a unit on the board that is illegal. This can be due to an adjudication error or cheating. Since it is not possible to replay previous rounds, the situation has to be corrected on the board. There are numerous ways to handle this situation (for instance, just play until the next adjustment turn).

Allan Calhamer wrote on this issue (in Diplomania, no. 12, August 1966, a copy can be found on 'www.diplomacy-archive.com'):

> A variety of rough-and-ready tactics were developed at this time. One was the "Flying Dutchman", which consisted in playing with a piece to which you were not entitled. It was ruled that this practice was legal so long as it was a deception; i.e., any player had a right to demand restoration of the true position, but if moves had intervened, they could not be taken back. It was never clear what the rights were if the deception was discovered during a move.

_I prefer that the unit is removed immediately according to the following rules:_

_* If the Flying Dutchman was introduced by a misadjudication of the last orders, then the last orders should be readjudicated. For instance, if the last orders contained too many build orders, the extra build order should be handled as in issue [4.D.8](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.8).
* If the Flying Dutchman was not introduced by the last adjudication, but the specific unit that is the Flying Dutchman can still be identified (taking previous turns into account), that unit should be removed.
* If a single unit cannot be identified as the Flying Dutchman, the civil disorder rules should be applied on all the units that could be the Flying Dutchman.
* The principle that an adjudication becomes irreversible when new orders are made public should still be followed. That means that if a Flying Dutchman becomes legal, then no correction should be made. However, if the Flying Dutchman is detected in the adjustment phase, before the adjustment orders are made public and the new number of supply centers would make the Flying Dutchman legal, then the Flying Dutchman should still be removed. The player may build another unit instead._

### 5\. THE PROCESS OF ADJUDICATION

_**The article "The Math of Adjudication" of the Diplomatic Pouch, Spring 2009 Movement contains additional information with more examples. However, this chapter was rewritten for version 3.0 of the DATC and is more recent than the article.**_

Writing a Diplomacy adjudicator program may look not more difficult than writing a program that checks the moves of a chess game. However, the contrary is true. A Diplomacy adjudicator that passes all test cases as described in this document contains many small and difficult details.

The first thing people think about when analyzing the rules of Diplomacy is the sequence in which the orders are processed. However, this is exactly that should not be done. None of the rulebooks describe or hint about the sequence in which the orders must be adjudicated. The rules are a set of "equations" or "conditions" that should be fulfilled. The first step is to make these equations more precise, more mathematically.

A key feature of these equations is that the result during adjudication will not change. An order succeeds or fails and that does not change during adjudication. However, when the adjudication is started its state is "unknown" or "unresolved". This in contrast to principles like a support is successful until it is cut or a move order succeeds until it bounces. Going that way makes writing a correct adjudicator very difficult.

When the equations are understood, the next step is to make an algorithm that finds a solution.

### 5.A. OVERVIEW OF DIPLOMACY EQUATIONS

There are three active orders that should be adjudicated in success or fail. The result can be kept in a Boolean, were success is true and fail is false.

* MOVE
* SUPPORT
* CONVOY

A unit is dislodged when it doesn't move and another unit successfully moves to the area. This doesn't need further explanation.

In further detailing out the conditions, it is possible to refer to the result of another order, even when the result of that order is not known yet. The sequence of adjudication of orders will be discussed later.

There are a number of different strengths that need to be calculated during adjudication. They may result in the same value, however may differ in some circumstances. They should not be confused.

* ATTACK STRENGTH  
    For each unit ordered to move, the strength to attack and conquer the area moved to.
* HOLD STRENGTH  
    For each area on the board the strength to prevent that a unit moves to that area. If the area is empty, the value is zero.
* DEFEND STRENGTH  
    The strength of unit ordered to move engaged in a head-to-head to prevent that the opposing unit succeeds.
* PREVENT STRENGTH  
    The strength of unit ordered to move preventing another unit ordered to succeed moving to the same area.

Typically, if a move is not engaged in a head-to-head battle the ATTACK STRENGTH must be greater than the HOLD STRENGTH of the area and the PREVENT STRENGTH of each of the units competing for the same area, to be successful.

If multiple units are ordered to move to the same area, then each order has its own success condition. So, there is not a mechanism to declare a grand winner of the contested area.

Example:
Germany:
A Berlin -> Silesia
A Munich Supports Berlin -> Silesia

Russia:
A Warsaw -> Silesia

Austria:
A Bohemia -> Silesia

The success of the MOVE orders of Berlin, Warsaw and Bohemia are determined separately. The orders of Warsaw and Bohemia fail, because their ATTACK STRENGTH is one, while the PREVENT STRENGTH of Berlin is two. The MOVE order of Berlin succeeds, because the ATTACK STRENGTH is two and that beats the PREVENT STRENGTH of both the units in Warsaw and Bohemia.

Similarly, in case of a head-to-head battle the MOVE of both units is determined separately.

Example:
Germany: 
A Berlin - Kiel
A Munich Supports F Kiel - Berlin

England: 
F Kiel - Berlin

In this example Germany probably reversed the support order in Munich by mistake. The MOVE of Berlin will fail, because the ATTACK STRENGTH is one, while the DEFEND STRENGTH of Kiel is two. The MOVE of Kiel will also fail, because the ATTACK STRENGTH of one is insufficient to beat the DEFEND STRENGTH of Berlin also on. Since Munich may not help in dislodging a unit of the same nationality, but may help in defending, the ATTACJ STRENGTH and DEFEND STRENGTH of Kiel are differently.

Finally, we have the PATH Boolean variable. For a convoying army it determines whether there is an uninterrupted path to the destination.

### 5.B. PRECISE DESCRIPTION OF THE EQUATIONS

With the general idea of the different terms given in the previous section, the conditions can be further detailed out. Note, that various rule issues, such as coasts or pre-scanning the orders are not covered here. They are not relevant for the algorithm.

#### 5.B.1. MOVE

* In case of a head-to-head battle, the move succeeds when the ATTACK STRENGTH is larger than the DEFEND STRENGTH of the opposing unit and larger than the PREVENT STRENGTH of any unit moving to the same area. If one of the opposing strengths is equal or greater, then the move fails.
* If there is no head-to-head battle, the move succeeds when the ATTACK STRENGTH is larger than the HOLD STRENGTH of the destination and larger than the PREVENT STRENGTH of any unit moving to the same area. If one of the opposing strengths is equal or greater, then the move fails.

#### 5.B.2. SUPPORT

A support order is cut (fails) when another unit is ordered to move to the area of the supporting unit and the following conditions are satisfied:

* The moving unit has a successful PATH.
* The moving unit is of a different nationality.
* The destination of the supported unit is not the area of the unit attacking the support.

Or:

* The unit successfully moves (dislodging the supporting unit).

#### 5.B.3. CONVOY

The convoy order is successful, if the fleet is not dislodged. So, no other unit moves successfully to the area.

#### 5.B.4. PATH

The PATH of a move order is successful when the unit can directly move to the destination and is not convoyed or is convoyed and there is a chain of adjacent fleets from origin to destination each with a matching and successful CONVOY order.

#### 5.B.5. HOLD STRENGTH

* The HOLD STRENGTH is defined for an area, rather than for an order.
* The hold strength is zero when the area is empty, or when it contains a unit with successful MOVE order.
* It is one when the area contains a unit with a failed MOVE ORDER
* In all other cases, it is one plus the number of units support it in hold with successful SUPPORT order.

#### 5.B.6. PREVENT STRENGTH

* If the PATH of the move order fails, then the PREVENT STRENGTH is 0.
* In cases where the move is part of a head-to-head battle and the MOVE order of the opposing unit is successful, then the prevent strength is 0.
* In the remaining cases the PREVENT STRENGTH is 1 plus the number of units with a successful SUPPORT order.

#### 5.B.7. DEFEND STRENGTH

The DEFEND STRENGTH of a unit with a move order is one plus the number of units supporting the move with a successful SUPPORT order.

#### 5.B.8. ATTACK STRENGTH

* If the PATH of the move order fails, then the ATTACK STRENGTH is zero.
* Otherwise, if the destination is empty, or in a case where there is no head-to-head battle and the unit at the destination has a move order for which the move is successful, then the ATTACK STRENGTH is one plus the number of units supporting the move with successful SUPPORT order.
* If not and the unit at the destination is of the same nationality, then the ATTACK STRENGTH is zero.
* In all other cases, the ATTACK STRENGTH is one plus the number of units supporting the move, of different nationality as the unit on the destination and with successful SUPPORT order.

#### 5.B.9. CIRCULAR MOVEMENT AND PARADOXES

It is possible that for an order set there is no solution for given condition or that there are multiple solutions. This is only possible when there is a circular dependency between the different conditions. That happens with circular movement or with a convoy paradox.

However, a circular dependency may also have just one solution. For instance, in case of a circular movement, if one the unit moves for sure because of a support or a unit won't move because of a bounce, the circular movement has only one solution. Similar, a convoy paradox might lose its paradox status if an additional support or bounce is added. If there is only one solution that solution must be taken.

In case of a circular dependency that has zero or two solutions the orders that are in the circular dependency must be examined. If they only consist of move orders, then it is a circular movement. All moves become successful. If there are any convoying fleets, then there is a convoy paradox. The Szykman rule must be applied and the CONVOY orders of the convoying fleets fail (ignoring the original condition for CONVOY order).

In case the adjudicator can also handle variants, other paradoxes may apply that do not fulfil above conditions. In such case it is best to let all orders in the cycle fail.

### 5.C. FROM CONDITIONS TO ALGORITHM

The next step is to transform the conditions as described in the previous sections to an algorithm. When finished, the algorithm can be tested with the test cases. Note, that if a bug is found, then it is unlikely to be a problem of the conditions described in the previous section. They have proven to be stable from the first version.

The adjudication program needs to handle the following situations:

1.  An order that is not indirectly dependent on itself.
2.  An order that is indirectly dependent on itself, but there is still exactly one resolution.
3.  An order that is indirectly dependent on itself and there are zero or two resolutions.

If it was only needed to adjudicate orders of category a, the algorithm would be simple. Just a recursive function that adjudicates an order and if it depends on a different order, it will call itself recursively. This also shows that it is not needed to be concerned about the sequence of orders. Rule of thumbs such as cut support first are not needed to be programmed.

It is also not difficult to detect whether the recursive hits a cyclic dependency. Applying the backup rule to the cycle will also not give too much trouble. The real challenge is to determine whether the cycle has just one solution as in category b (that solution should then be taken) or zero or two solutions as in category c (the backup rule should be applied).

There are two approaches to this problem:

* Making decision on partial information.
* Guessing different resolutions.

Both can lead to a correct algorithm. The difference can be best explained by an example:

Russia:
A Constantinople - Smyrna

Turkey: 
F Ankara - Constantinople
A Smyrna - Ankara
A Bulgaria Supports F Ankara - Constantinople

This circular movement has only solution, because MOVE of Ankara to Constantinople is guaranteed to succeed, due to the support. And this is exactly how an algorithm based on partial information works. Even if the MOVE order of Constantinople to Smyrna is still uncertain, it can be concluded that the HOLD STRENGTH of Constantinople is zero or one, but not higher. The ATTACK STRENGTH of Ankara to Constantinople is two and will always beat this allowing the MOVE to succeed. When this is concluded, the other MOVE orders can also succeed.

The guessing algorithm just makes a guess for one of the orders. For instance, it guesses that the MOVE from Smyrna to Ankara fails. As result the MOVE from Constantinople to Smyrna fails, but the MOVE from Ankara to Constantinople still succeeds. If then the MOVE of the Smyrna is adjudicated it is concluded that it succeeds which is inconsistent with the initial guess. The guess can be repeated with a successful MOVE and then a consistent adjudication is obtained.

For both approaches it is suggested to make two mutual recursive functions (in Python code):

def adjudicate(order):
    ...

def resolve(order):
    ...

Both functions take an order reference as input (in other languages this can be an index or pointer) and return as Boolean the success or failure of the order.

The "adjudicate" function implements the conditions as discussed earlier. The function can be split up in adjudicate functions for MOVE, SUPPORT and CONVOY and separate functions for PATH and STRENGTH values. If the result of another order is required, then it will call the "resolve" function. The "adjudicate" function will not update any administration.

The "resolve" function is a generic function and has no knowledge about the details of the orders. It updates the administration when an adjudication becomes final, prevents that the same order is adjudicated twice, detect cyclic dependencies and applies the backup rule if needed.

The adjudicate function will be roughly the same for both approaches, while the resolve function will be fundamentally different.

The final program is then just calling resolve for each order to ensure that every order is resolved.

### 5.D. THE TROUBLE WITH PANDIN'S PARADOX

For solving circular dependencies, it would be great if each order is part of at most one cycle. However, in convoy paradoxes, it can be complex. Consider Pandin's paradox:

England: 
F London Supports F Wales - English Channel
F Wales - English Channel

France: 
A Brest - London
F English Channel Convoys A Brest - London

Germany: 
F North Sea Supports F Belgium - English Channel
F Belgium - English Channel

The cycle of dependencies looks like this:

English Channel Wales Belgium London

The arrows are in the direction of going deeper in recursion. To decide whether the convoying fleet in the English succeeds it is needed to know whether the fleet in Wales or Belgium succeeds. For calculating the success of Wales and Belgium, the result of the SUPPORT of London is required. And the SUPPORT of London depends on the successful CONVOY of the English Channel. Note, the MOVE of the army in Brest is a key ingredient of this paradox, but is not listed in the cycle. The success of this order is not relevant (it always fails), the question is whether it will cut the SUPPORT of London.

The fact that there is not a single cycle, makes the algorithms complicated. In case the algorithm can make decisions on partial information, then it can conclude that the unit in Wales will never succeed, because it will never have enough ATTACK STRENGTH against the unit in Belgium. However, the algorithm should ensure that all decisions on partial information are finished, before acting on cycles.

For a guessing algorithm these situations are very difficult to handle. For instance, it should not start making a guess on Wales, because that order is not a key decision that influences the paradox.

There is a simple hack that ensures that only clean single cycle can happen. The adjudicate function for CONVOY would normally call resolve for any units attacking the convoy. That make the success of the fleet in the English Channel dependent on Wales and Belgium in above example. However, if the adjudicate function is called instead, the dependency is skipped and all cycles will be clean and simple. In the above example the cycle will only consists out of English Channel and London. If the Szykman rule is applied on that cycle, the English Channel will fail to convoy and all other orders can be resolved.

### 5.E. THE PARTIAL INFORMATION ALGORITHM

If the success or failure of any dependent order is still uncertain it might be needed to adjudicate an order twice. This can best be illustrated by an example:

England:
F North Sea - Holland
F Belgium Support F North Sea - Holland

Germany:
A Holland Hold

Suppose furthermore that the SUPPORT of Belgium cannot be determined yet. To see whether the North Sea MOVE succeeds, the ATTACK STRENGTH is calculated. This may not exceed 1 and this insufficient to dislodge Holland. However, this absence of success does not imply that the order fails. This can separately be checked.

In earlier descriptions of this algorithm the failure and success of an order in the adjudicate function was implemented separately, doubling the code. However, there is a neat trick to avoid that. Both adjudicate and resolve functions get an additional parameter:

def adjudicate(order, optimistic):
    ...

def resolve(order, optimistic):
    ...

If the optimistic parameter is True, then any uncertain information is assumed to have a value that is supportive for letting the order succeed. In the pessimistic scenario (the parameter is False) the opposite. STRENGTH values will return what the strength will be at most in the optimistic scenario and the least in the pessimistic scenario.

The adjudicate function will not check on the optimistic parameter, but just pass it to its subfunctions and to the resolve function, but sometimes inverse it. For instance, for a MOVE adjudication the ATTACK STRENGTH must be calculated. In the optimistic scenario the optimistic ATTACK STRENGTH is calculated but for the STRENGTH values of any opposing unit the pessimistic value is used. Similar, in the optimistic scenario of a SUPPORT or CONVOY order the pessimistic result is used for any unit that can let the order fail.

The resolve function (with cycle detection, but without the backup rule) becomes something like this:

def resolve(order, optimistic):
    if order.resolved:
        return order.resolution

    if order.visited:
        # We hit cyclic dependency.
        return optimistic # Success when optimistic,
                          # fail when pessimistic.

    order.visited = True # Prevent endless recursion.
    opt_result = adjudicate(order, True)
    pes_result = adjudicate(order, False)
    order.visited = False
    
    if opt\_result == pes\_result:
        # We have a single resolution.
        # Store the result and return it.
        order.resolution = opt_result
        order.resolved = True
        return opt_result

    # Order still undecided. Success when optimistic.
    return optimistic.

As you can see the resolve function does not just pass the optimistic parameter to the adjudicate function. It will try both optimistic and pessimistic scenarios and if they are in agreement the order is resolved.

In case there is only one resolution of the situation, then the resolve function will always resolve the order (although, the resolution of any depending orders may still stay open). To add the backup rule for cyclic movement and the Szykman rule, we need to track which orders are in the cycle when no resolution could be found. We do this by keeping those orders in a global array 'cycle'. Example code:

def resolve(order, optimistic):
    global cycle
    if order.resolved:
        return order.resolution

    if order in cycle:
        # We already concluded that this order is in a cycle
        # which we cannot yet resolve.
        return optimistic # Success when optimistic,
                          # fail when pessimistic.

    if order.visited:
        # We hit cyclic dependency.
        cycle.add(order)
        return optimistic

    order.visited = True # Prevent endless recursion.
    old\_cycle\_len = len(cycle)
    opt_result = adjudicate(order, True)
    pes_result = adjudicate(order, False)
    order.visited = False
    
    if opt\_result == pes\_result:
        # We have a single resolution.
        # Wipe out any cycle information that was found in
        # recursion.
        del cycle\[old\_cycle\_len:\]
        # Store the result and return it.
        order.resolution = opt_result
        order.resolved = True
        return opt_result

    if order in cycle:
        # We returned from recursion, where this order hit the
        # cycle and we didn't get a single resolution.
        # Apply backup rule on all those orders.
        backup\_rule(cycle\[old\_cycle_len:\])
        del cycle\[old\_cycle\_len:\]
        # The backup rule might not have resolved this order.
        return resolve(order, optimistic)

    # We are returning from a situation where a cycle was
    # detected. However, this order is not the ancestor of the
    # whole cycle. We further retreat from recursion.
    cycle.add(order)
    return optimistic

If the cycle is not a clean single cycle, it may fail in general, although not with the standard rules. If the resolve function is called on Wales as in the situation of [5.D](https://webdiplomacy.net/doc/DATC_v3_0.html#5.D), it will call in recursion, London, English Channel, Wales, Belgium and London before retreating from recursion. Then it will conclude that there is a convoy paradox when it is back by the London order. But at that moment, the Wales order is still undecided, while it could be decided by partial information. With the standard rules this still goes right, however, in case of variant rules things can be different. A way to fix this is to retreat in recursion up to the order that is the ancestor of the whole cycle (Wales in the example). This can be achieved by adding a global integer 'recursion_hits' that keeps track how many times the recursion hit previous visited orders:

def resolve(order, optimistic):
    global cycle, recursion_hits
    if order.resolved:
        return order.resolution

    if order in cycle:
        # We already concluded that this order is in a cycle
        # which we cannot yet resolve.
        return optimistic # Success when optimistic,
                          # fail when pessimistic.

    if order.visited:
        # We hit cyclic dependency.
        cycle.add(order)
        recursion_hits += 1
        return optimistic

    order.visited = True # Prevent endless recursion.
    old\_cycle\_len = len(cycle)
    old\_recursion\_hits = recursion_hits
    opt_result = adjudicate(order, True)
    pes_result = adjudicate(order, False)
    order.visited = False
    
    if opt\_result == pes\_result:
        # We have a single resolution. Wipe out any
        # cycle information that was found in recursion.
        del cycle\[old\_cycle\_len:\]
        recursion\_hits = old\_recursion_hits
        # Store the result and return it.
        order.resolution = opt_result
        order.resolved = True
        return opt_result

    if order in cycle:
        # We returned from recursion, where this order hit the
        # cycle and we didn't get a single resolution.
        recursion_hits -= 1

    if recursion\_hits == old\_recursion_hits:
        # We have sufficiently retreated from recursion such
        # that this order was the ancestor of the whole cycle.
        # Apply backup rule on all orders in cycle.
        backup\_rule(cycle\[old\_cycle_len:\])
        del cycle\[old\_cycle\_len:\]
        # The backup rule might not have resolved this order.
        return resolve(order, optimistic)

    # We are returning from a situation where a cycle was
    # detected. However, this order is not the ancestor of the
    # whole cycle. We further retreat from recursion.
    if not order in cycle:
        cycle.add(order)
    return optimistic

This is a very robust way of handling, especially in variants, since all orders that can be decided on partial or full information will decided that way (as players expect).

The disadvantage of this algorithm is that all orders are adjudicated twice, in optimistic and pessimistic mode. With modern powerful computers, this shouldn't be a problem, except when it is used in an AI engine. A simple optimization is to skip the pessimistic adjudication when the optimistic adjudication fails. In such case the pessimistic adjudication is guaranteed to fail also. A further optimization is to track whether the adjudication of an order was fully dependent on resolved orders. In such case, one adjudication suffice. This can be implemented by adding another global variable 'uncertain'. This variable is set to True if a dependent order does not have a resolution yet and kept unaltered otherwise.

def resolve(order, optimistic):
    global cycle, recursion_hits, uncertain
    if order.resolved:
        return order.resolution

    if order in cycle:
        # We already concluded that this order is in a cycle
        # which we cannot yet resolve.
        # Result is based on uncertain information.
        uncertain = True
        return optimistic # Success when optimistic,
                          # fail when pessimistic.

    if order.visited:
        # We hit cyclic dependency.
        cycle.add(order)
        recursion_hits += 1
        uncertain = True
        return optimistic

    order.visited = True # Prevent endless recursion.
    old\_cycle\_len = len(cycle)
    old\_recursion\_hits = recursion_hits
    old_uncertain = uncertain
    uncertain = False
    opt_result = adjudicate(order, True)
    # Try to avoid a second adjudication for performance.
    pes\_result = adjudicate(order, False) if uncertain and opt\_result else opt_result
    order.visited = False
    
    if opt\_result == pes\_result:
        # We have a single resolution. Wipe out any
        # cycle information that was found in recursion.
        del cycle\[old\_cycle\_len:\]
        recursion\_hits = old\_recursion_hits
        # The uncertain variable must be unaltered, because
        # order is resolved now.
        uncertain = old_uncertain
        # Store the result and return it.
        order.resolution = opt_result
        order.resolved = True
        return opt_result

    if order in cycle:
        # We returned from recursion, where this order hit the
        # cycle and we didn't get a single resolution.
        recursion_hits -= 1

    if recursion\_hits == old\_recursion_hits:
        # We have sufficiently retreated from recursion such
        # that this order was the ancestor of the whole cycle.
        # Apply backup rule on all orders in cycle.
        backup\_rule(cycle\[old\_cycle_len:\])
        del cycle\[old\_cycle\_len:\]
        uncertain = old_uncertain
        # The backup rule might not have resolved this order.
        return resolve(order, optimistic)

    # We are returning from a situation where a cycle was
    # detected. However, this order is not the ancestor of the
    # whole cycle. We further retreat from recursion.
    if not order in cycle:
        cycle.add(order)
    return optimistic

One should remind that one adjudicate call, may result in multiple resolve calls for the same order. For instance, for MOVE order the ATTACK STRENGTH is calculated and the HOLD STRENGTH of the destination. Both STRENGTH values depend on the MOVE on the unit on the destination. Especially in a cyclic movement, where orders cannot directly get a permanent resolution, there is a risk that one gets an exponential explosion. If the cyclic movement consists of 10 moves, they may lead to 2 to the power of 10 (1024) adjudications. In above resolve function this is prevented by the check 'if order in cycle:'. One could also program the adjudicate function in such way that double calls to resolve are not made.

### 5.F. THE GUESS ALGORITHM

In the guess algorithm different resolutions are tried and checked on consistency. The difficulty is to do this in a simple recursive function. The trick is to set the guess value when an order is visited for the first time and use this guess value when this order is visited again deeper in the recursion. If this happens orders are again added to the global variable 'cycle' when returning from the recursion.

def resolve(order):
    global cycle
    if order.resolved or order in cycle:
        # In case the order is in cycle, then the resolution
        # given earlier was stored in the resolution,
        # without setting the order to resolved.
        return order.resolution

    if order.visited:
        # We hit a cyclic dependency.
        cycle.add(order)
        return order.resolution

    order.visited = True # Prevent indefinite recursion.
    old\_cycle\_len = len(cycle)
    # We set the resolution to the value that is returned when
    # the same order is visited deeper in recursion.
    order.resolution = False
    first_result = adjudicate(order)

    if len(cycle) == old\_cycle\_len:
        # No cyclic dependencies were detected.
        # We can just take this resolution.
        order.resolution = first_result
        order.resolved = True
        return first_result

    if order in cycle:
        # Deeper in the recursion we hit a cycle on this order.
        # Try to adjudicate the cycle with different guess.    
        del cycle\[old\_cycle\_len:\]
        order.resolution = True # Was False on first run.
        second_result = adjudicate(order)

        if first\_result == second\_result:
            # Although we hit a cycle, there is only one result.
            del cycle\[old\_cycle\_len:\]
            order.resolution = first_result
            order.resolved = True
            return first_result

        # Different results on different guesses.
        backup\_rule(cycle\[old\_cycle_len:\])
        del cycle\[old\_cycle\_len:\]
        order.visited = False
        # Backup rule might not have resolved this order.
        return resolve(order)

    # We are returning from recursion where we hit a cycle,
    # but was not started on this order.
    cycle.add(order)
    # We remember the result if resolve is called again on same
    # order, while cycle is not yet resolved.
    order.resolution = first_result
    order.visited = False
    return first_result

Again, this algorithm is problematic when there is a cycle that is not a clean single cycle. This can be fixed with the hack described in section [5.D](https://webdiplomacy.net/doc/DATC_v3_0.html#5.D). There is no straight forward way to fix this in the generic resolve function in theoretical correct way. However, if the algorithm retreats to the situation where the order is the ancestor of the whole cycle, then in practice it will work.

If the resolve function is called on Wales as in the situation of [5.D](https://webdiplomacy.net/doc/DATC_v3_0.html#5.D), then the result will be negative, whether it guesses positive or negative, although the remaining paradox is not tried in two ways. If the resolve function is called on Belgium, London or English Channel, then the paradox is detected and Wales is added (incorrectly) to the cycle. However, the backup rule won't touch this order, so, it still goes right. For implementation, again a global variable 'recursion\_hits' is added. But also a Boolean variable 'guess\_based' is necessary, because looking whether the cycle has increased is not correct if multiple cycles are possible.

def resolve(order):
    global cycle, guess\_based, recursion\_hits
    if order.resolved
        return order.resolution

    if order in cycle:
        # In case the order is in cycle, then the resolution
        # given earlier was stored in the resolution,
        # without setting the order to resolved.
        guess_based = True
        return order.resolution

    if order.visited:
        # We hit a cyclic dependency.
        cycle.add(order)
        guess_based = True
        recursion_hits += 1
        return order.resolution

    order.visited = True # Prevent indefinite recursion.
    old\_cycle\_len = len(cycle)
    old\_guess\_based = guess_based
    guess_based = False
    old\_recursion\_hits = recursion_hits   
    # We set the resolution to the value that is returned when
    # this order is visited deeper in recursion.
    order.resolution = False
    first_result = adjudicate(order)

    if not guess_based:
        # No cyclic dependencies were detected.
        # We can just take this resolution.
        guess\_based = old\_guess_based
        order.resolution = first_result
        order.resolved = True
        return first_result

    # If order in cycle, this order was hit in recursion, but
    # we might need to retreat further in recursion.
    if order in cycle:
        recursion_hits -= 1

    if recursion\_hits == old\_recursion_hits:
        # Deeper in the recursion we hit a cycle on this order.
        # And this order is the ancestor of the whole cycle.
        # Try to adjudicate the cycle with different guess.    
        del cycle\[old\_cycle\_len:\]
        order.resolution = True # Was False on first run.
        second_result = adjudicate(order)

        if first\_result == second\_result:
            # Although we hit a cycle, there is only one result.
            del cycle\[old\_cycle\_len:\]
            guess\_based = old\_guess_based
            order.resolution = first_result
            order.resolved = True
            return first_result

        # Different results on different guesses.
        backup\_rule(cycle\[old\_cycle_len:\])
        del cycle\[old\_cycle\_len:\]
        guess\_based = old\_guess_based
        order.visited = False
        # Backup rule might not have resolved this order.
        return resolve(order)

    # We are returning from recursion where we hit a cycle,
    # but this order is not the ancestor of the whole cycle.
    if not order in cycle:
        cycle.add(order)
    # We remember the result if resolve is called again on same
    # order, while cycle is not yet resolved.
    order.resolution = first_result
    order.visited = False
    return first_result

### 6\. TEST CASES

### 6.A. TEST CASES, BASIC CHECKS

#### 6.A.1. TEST CASE, MOVING TO AN AREA THAT IS NOT A NEIGHBOUR

Check if an illegal move (without convoy) will fail.

England: 
F North Sea - Picardy

Order should fail.

#### 6.A.2. TEST CASE, MOVE ARMY TO SEA

Check if an army could not be moved to open sea.

England: 
A Liverpool - Irish Sea

Order should fail.

#### 6.A.3. TEST CASE, MOVE FLEET TO LAND

Check whether a fleet cannot move to land.

Germany: 
F Kiel - Munich

Order should fail.

#### 6.A.4. TEST CASE, MOVE TO OWN SECTOR

Moving to the same sector is an illegal move (2023 rulebook, page 7, "An Army can be ordered to move into an adjacent inland or coastal province.").

Germany: 
F Kiel - Kiel

Program should not crash.

#### 6.A.5. TEST CASE, MOVE TO OWN SECTOR WITH CONVOY

Moving to the same sector is still illegal with convoy (2023 rulebook, page 7, "Note: An Army can move across water provinces from one coastal province to another...").

England: 
F North Sea Convoys A Yorkshire - Yorkshire
A Yorkshire - Yorkshire
A Liverpool Supports A Yorkshire - Yorkshire

Germany:
F London - Yorkshire
A Wales Supports F London - Yorkshire

The move of the army in Yorkshire is illegal. This makes the support of Liverpool also illegal and without the support, the Germans have a stronger force. The army in London dislodges the army in Yorkshire.

#### 6.A.6. TEST CASE, ORDERING A UNIT OF ANOTHER COUNTRY

Check whether someone cannot order a unit that is not his own unit.

England has a fleet in London.

Germany: 
F London - North Sea

Order should fail.

#### 6.A.7. TEST CASE, ONLY ARMIES CAN BE CONVOYED

A fleet cannot be convoyed.

England: 
F London - Belgium
F North Sea Convoys A London - Belgium

Move from London to Belgium should fail.

#### 6.A.8. TEST CASE, SUPPORT TO HOLD YOURSELF IS NOT POSSIBLE

An army cannot get an additional hold power by supporting itself.

Italy: 
A Venice - Trieste
A Tyrolia Supports A Venice - Trieste

Austria: 
F Trieste Supports F Trieste

The army in Trieste should be dislodged.

#### 6.A.9. TEST CASE, FLEETS MUST FOLLOW COAST IF NOT ON SEA

If two provinces are adjacent, that does not mean that a fleet can move between those two provinces. An implementation that only holds one list of adjacent provinces for each province is incorrect.

Italy: 
F Rome - Venice

Move fails. An army can go from Rome to Venice, but a fleet cannot.

#### 6.A.10. TEST CASE, SUPPORT ON UNREACHABLE DESTINATION NOT POSSIBLE

The destination of the move that is supported must be reachable by the supporting unit.

Austria: 
A Venice Hold

Italy: 
F Rome Supports A Apulia - Venice
A Apulia - Venice

The support of Rome is illegal, because Venice cannot be reached from Rome by a fleet. Venice is not dislodged.

#### 6.A.11. TEST CASE, SIMPLE BOUNCE

Two armies bouncing on each other.

Austria: 
A Vienna - Tyrolia

Italy: 
A Venice - Tyrolia

The two units bounce.

#### 6.A.12. TEST CASE, BOUNCE OF THREE UNITS

If three units move to the same area, the adjudicator should not bounce the first two units and then let the third unit go to the now open area.

Austria: 
A Vienna - Tyrolia

Germany: 
A Munich - Tyrolia

Italy: 
A Venice - Tyrolia

The three units bounce.

### 6.B. TEST CASES, COASTAL ISSUES

#### 6.B.1. TEST CASE, MOVING WITH UNSPECIFIED COAST WHEN COAST IS NECESSARY

Coast is significant in this case:

France: 
F Portugal - Spain

Move should fail.

#### 6.B.2. TEST CASE, MOVING WITH UNSPECIFIED COAST WHEN COAST IS NOT NECESSARY

There is only one coast possible in this case:

France: 
F Gascony - Spain

Since the North Coast is the only coast that can be reached, it seems logical that a move is attempted to the north coast of Spain. See issue [4.B.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.2).

_I prefer that an attempt is made to the only possible coast, the north coast of Spain._

#### 6.B.3. TEST CASE, MOVING WITH WRONG COAST WHEN COAST IS NOT NECESSARY

If only one coast is possible, but the wrong coast can be specified.

France: 
F Gascony - Spain(sc)

If the rules are given a lenient interpretation, a move will be attempted to the north coast of Spain. However, this order is very precisely wrong. The order should be declared illegal and fleet should hold. See issue [4.B.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.3).

#### 6.B.4. TEST CASE, SUPPORT TO UNREACHABLE COAST ALLOWED

A fleet can give support to a coast where it cannot go.

France: 
F Gascony - Spain(nc)
F Marseilles Supports F Gascony - Spain(nc)

Italy: 
F Western Mediterranean - Spain(sc)

Although the fleet in Marseilles cannot go to the north coast it can still support targeting the north coast. So, the support is successful, the move of the fleet in Gascony succeeds and the move of the Italian fleet fails.

#### 6.B.5. TEST CASE, SUPPORT FROM UNREACHABLE COAST NOT ALLOWED

A fleet cannot give support to an area that cannot be reached from the current coast of the fleet.

France: 
F Marseilles - Gulf of Lyon
F Spain(nc) Supports F Marseilles - Gulf of Lyon

Italy: 
F Gulf of Lyon Hold

The Gulf of Lyon cannot be reached from the North Coast of Spain. Therefore, the support of Spain is illegal and the fleet in the Gulf of Lyon is not dislodged.

#### 6.B.6. TEST CASE, SUPPORT CAN BE CUT WITH OTHER COAST

Support can be cut from the other coast.

England: 
F Irish Sea Supports F North Atlantic Ocean - Mid-Atlantic Ocean
F North Atlantic Ocean - Mid-Atlantic Ocean

France: 
F Spain(nc) Supports F Mid-Atlantic Ocean
F Mid-Atlantic Ocean Hold

Italy: 
F Gulf of Lyon - Spain(sc)

The Italian fleet in the Gulf of Lyon will cut the support in Spain. That means that the French fleet in the Mid Atlantic Ocean will be dislodged by the English fleet in the North Atlantic Ocean.

#### 6.B.7. TEST CASE, SUPPORTING OWN UNIT WITH UNSPECIFIED COAST

It is a little bit harsh to reject this.

France: 
F Portugal Supports F Mid-Atlantic Ocean - Spain
F Mid-Atlantic Ocean - Spain(nc)

Italy: 
F Gulf of Lyon Supports F Western Mediterranean - Spain(sc)
F Western Mediterranean - Spain(sc)

See issue [4.B.4](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.4).

_I prefer that the support succeeds and the Italian fleet in the Western Mediterranean bounces. However, if orders are checked on submission (such as in webbased play), support without coast should not be given as an option._

#### 6.B.8. TEST CASE, SUPPORTING WITH UNSPECIFIED COAST WHEN ONLY ONE COAST IS POSSIBLE

If coast is omitted while only coast is possible, it should be considered a poorly written order, that should be followed.

France: 
F Portugal Supports F Gascony - Spain
F Gascony - Spain(nc)

Italy: 
F Gulf of Lyon Supports F Western Mediterranean - Spain(sc)
F Western Mediterranean - Spain(sc)

Support of Portugal is successful and the Italian fleet in the Western Mediterranean bounces with the French fleet from Gascony.

#### 6.B.9. TEST CASE, SUPPORTING WITH WRONG COAST

It should be possible to specify a coast and that coast should match.

France: 
F Portugal Supports F Mid-Atlantic Ocean - Spain(nc)
F Mid-Atlantic Ocean - Spain(sc)

Italy: 
F Gulf of Lyon Supports F Western Mediterranean - Spain(sc)
F Western Mediterranean - Spain(sc)

See issue [4.B.4](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.4). Support of Portugal is invalid and the Italian fleet in the Western Mediterranean moves successfully.

#### 6.B.10. TEST CASE, UNIT ORDERED WITH WRONG COAST

A player might specify the wrong coast for the ordered unit.

France has a fleet on the south coast of Spain and orders:

France:
F Spain(nc) - Gulf of Lyon

If only perfect orders are accepted, then the move will fail, but since the coast for the ordered unit has no purpose, it might also be ignored (see issue [4.B.5](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.5)).

_I prefer that a move will be attempted._

#### 6.B.11. TEST CASE, COAST CANNOT BE ORDERED TO CHANGE

The coast cannot change by just ordering the other coast.

France has a fleet on the north coast of Spain and orders:

France:
F Spain(sc) - Gulf of Lyon

The move fails.

#### 6.B.12. TEST CASE, ARMY MOVEMENT WITH COASTAL SPECIFICATION

For armies the coasts are irrelevant:

France:
A Gascony - Spain(nc)

If only perfect orders are accepted, then the move will fail. But it is also possible that coasts are ignored in this case and a move will be attempted (see issue [4.B.6](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.6)).

_I prefer that a move will be attempted._

#### 6.B.13. TEST CASE, COASTAL CRAWL NOT ALLOWED

If a fleet is leaving a sector from a certain coast while in the opposite direction another fleet is moving to another coast of the sector, it is still a head-to-head battle. This has been decided in the great revision of the 1961 rules that resulted in the 1971 rules.

Turkey: 
F Bulgaria(sc) - Constantinople
F Constantinople - Bulgaria(ec)

Both moves fail.

#### 6.B.14. TEST CASE, BUILDING WITH UNSPECIFIED COAST

Coast must be specified in certain build cases:

Russia: 
Build F St Petersburg

See issue [4.B.7](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.7). Build fails.

#### 6.B.15. TEST CASE, SUPPORTING FOREIGN UNIT WITH UNSPECIFIED COAST

Opinions differ on this.

France:
F Portugal Supports F Mid-Atlantic Ocean - Spain

England:
F Mid-Atlantic Ocean - Spain(nc)

Italy: 
F Gulf of Lyon Supports F Western Mediterranean - Spain(sc)
F Western Mediterranean - Spain(sc)

See issue [4.B.4](https://webdiplomacy.net/doc/DATC_v3_0.html#4.B.4).

_Although the move to the north coast of Spain might be a surprise for France, it is hard to believe that England somehow tricked France. Therefore, I prefer that the support succeeds and the Italian fleet in the Western Mediterranean bounces. However, if orders are checked on submission (such as in webbased play), support without coast should not be given as an option._

### 6.C. TEST CASES, CIRCULAR MOVEMENT

#### 6.C.1. TEST CASE, THREE ARMY CIRCULAR MOVEMENT

Three units can change place, even in spring 1901.

Turkey: 
F Ankara - Constantinople
A Constantinople - Smyrna
A Smyrna - Ankara

All three units will move.

#### 6.C.2. TEST CASE, THREE ARMY CIRCULAR MOVEMENT WITH SUPPORT

Three units can change place, even when one gets support.

Turkey: 
F Ankara - Constantinople
A Constantinople - Smyrna
A Smyrna - Ankara
A Bulgaria Supports F Ankara - Constantinople

Of course, the three units will move, but knowing how programs are written, this can confuse the adjudicator.

#### 6.C.3. TEST CASE, A DISRUPTED THREE ARMY CIRCULAR MOVEMENT

When one of the units bounces, the whole circular movement will hold.

Turkey: 
F Ankara - Constantinople
A Constantinople - Smyrna
A Smyrna - Ankara
A Bulgaria - Constantinople

Every unit will keep its place.

#### 6.C.4. TEST CASE, A CIRCULAR MOVEMENT WITH ATTACKED CONVOY

When the circular movement contains an attacked convoy, the circular movement succeeds. The adjudication algorithm should handle attack of convoys before calculating circular movement.

Austria: 
A Trieste - Serbia
A Serbia - Bulgaria

Turkey: 
A Bulgaria - Trieste
F Aegean Sea Convoys A Bulgaria - Trieste
F Ionian Sea Convoys A Bulgaria - Trieste
F Adriatic Sea Convoys A Bulgaria - Trieste

Italy: 
F Naples - Ionian Sea

The fleet in the Ionian Sea is attacked but not dislodged. The circular movement succeeds. The Austrian and Turkish armies will advance.

#### 6.C.5. TEST CASE, A DISRUPTED CIRCULAR MOVEMENT DUE TO DISLODGED CONVOY

When the circular movement contains a convoy, the circular movement is disrupted when the convoying fleet is dislodged. The adjudication algorithm should disrupt convoys before calculating circular movement.

Austria: 
A Trieste - Serbia
A Serbia - Bulgaria

Turkey: 
A Bulgaria - Trieste
F Aegean Sea Convoys A Bulgaria - Trieste
F Ionian Sea Convoys A Bulgaria - Trieste
F Adriatic Sea Convoys A Bulgaria - Trieste

Italy: 
F Naples - Ionian Sea
F Tunis Supports F Naples - Ionian Sea

Due to the dislodged convoying fleet, all Austrian and Turkish armies will not move.

#### 6.C.6. TEST CASE, TWO ARMIES WITH TWO CONVOYS

Two armies can swap places even when they are not adjacent.

England: 
F North Sea Convoys A London - Belgium
A London - Belgium

France: 
F English Channel Convoys A Belgium - London
A Belgium - London

Both convoys should succeed.

#### 6.C.7. TEST CASE, DISRUPTED UNIT SWAP

If in a swap one of the unit bounces, then the swap fails.

England: 
F North Sea Convoys A London - Belgium
A London - Belgium

France: 
F English Channel Convoys A Belgium - London
A Belgium - London
A Burgundy - Belgium

None of the units will succeed to move.

#### 6.C.8. TEST CASE, NO SELF DISLODGEMENT IN DISRUPTED CIRCULAR MOVEMENT

Self dislodgement is prohibited as usual in circular movement.

Turkey:
F Constantinople - Black Sea
A Bulgaria - Constantinople
A Smyrna Supports A Bulgaria - Constantinople

Russia:
F Black Sea - Bulgaria(ec)

Austria
A Serbia - Bulgaria

None of the units will succeed to move.

#### 6.C.9. TEST CASE, NO HELP IN DISLODGEMENT OF OWN UNIT IN DISRUPTED CIRCULAR MOVEMENT

Helping to dislodge your own unit is prohibited as usual in circular movement.

Turkey:
F Constantinople - Black Sea
A Smyrna Supports A Bulgaria - Constantinople

Russia:
F Black Sea - Bulgaria(ec)

Austria
A Serbia - Bulgaria
A Bulgaria - Constantinople

None of the units will succeed to move.

### 6.D. TEST CASES, SUPPORTS AND DISLODGES

#### 6.D.1. TEST CASE, SUPPORTED HOLD CAN PREVENT DISLODGEMENT

The simplest support to hold order.

Austria: 
F Adriatic Sea Supports A Trieste - Venice
A Trieste - Venice

Italy: 
A Venice Hold
A Tyrolia Supports A Venice

The support of Tyrolia prevents the army in Venice from being dislodged. The army in Trieste will not move.

#### 6.D.2. TEST CASE, A MOVE CUTS SUPPORT ON HOLD

The simplest support on hold cut.

Austria: 
F Adriatic Sea Supports A Trieste - Venice
A Trieste - Venice
A Vienna - Tyrolia

Italy: 
A Venice Hold
A Tyrolia Supports A Venice

The support of Tyrolia is cut by the army in Vienna. That means that the army in Venice is dislodged by the army from Trieste.

#### 6.D.3. TEST CASE, A MOVE CUTS SUPPORT ON MOVE

The simplest support on move cut.

Austria: 
F Adriatic Sea Supports A Trieste - Venice
A Trieste - Venice

Italy: 
A Venice Hold
F Ionian Sea - Adriatic Sea

The support of the fleet in the Adriatic Sea is cut. That means that the army in Venice will not be dislodged and the army in Trieste stays in Trieste.

#### 6.D.4. TEST CASE, SUPPORT TO HOLD ON UNIT SUPPORTING A HOLD ALLOWED

A unit that is supporting a hold, can receive a hold support.

Germany: 
A Berlin Supports F Kiel
F Kiel Supports A Berlin

Russia: 
F Baltic Sea Supports A Prussia - Berlin
A Prussia - Berlin

The Russian move from Prussia to Berlin fails.

#### 6.D.5. TEST CASE, SUPPORT TO HOLD ON UNIT SUPPORTING A MOVE ALLOWED

A unit that is supporting a move, can receive a hold support.

Germany: 
A Berlin Supports A Munich - Silesia
F Kiel Supports A Berlin
A Munich - Silesia

Russia: 
F Baltic Sea Supports A Prussia - Berlin
A Prussia - Berlin

The Russian move from Prussia to Berlin fails.

#### 6.D.6. TEST CASE, SUPPORT TO HOLD ON CONVOYING UNIT ALLOWED

A unit that is convoying, can receive a hold support.

Germany: 
A Berlin - Sweden
F Baltic Sea Convoys A Berlin - Sweden
F Prussia Supports F Baltic Sea

Russia: 
F Livonia - Baltic Sea
F Gulf of Bothnia Supports F Livonia - Baltic Sea

The Russian move from Livonia to the Baltic Sea fails. The convoy from Berlin to Sweden succeeds.

#### 6.D.7. TEST CASE, SUPPORT TO HOLD ON MOVING UNIT NOT ALLOWED

A unit that is moving, cannot receive a hold support for the situation that the move fails.

Germany: 
F Baltic Sea - Sweden
F Prussia Supports F Baltic Sea

Russia: 
F Livonia - Baltic Sea
F Gulf of Bothnia Supports F Livonia - Baltic Sea
A Finland - Sweden

The support of the fleet in Prussia fails. The fleet in Baltic Sea will bounce on the Russian army in Finland and will be dislodged by the Russian fleet from Livonia when it returns to the Baltic Sea.

#### 6.D.8. TEST CASE, FAILED CONVOY CANNOT RECEIVE HOLD SUPPORT

If a convoy fails because of disruption of the convoy or when the right convoy orders are not given, then the army to be convoyed cannot receive support in hold, since it still tried to move.

Austria: 
F Ionian Sea Hold
A Serbia Supports A Albania - Greece
A Albania - Greece

Turkey: 
A Greece - Naples
A Bulgaria Supports A Greece

There was a possible convoy from Greece to Naples, before the orders were made public (via the Ionian Sea). This means that the order of Greece to Naples should never be treated as illegal order and be changed in a hold order able to receive hold support (see also issue [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1)). Therefore, the support in Bulgaria fails and the army in Greece is dislodged by the army in Albania.

#### 6.D.9. TEST CASE, SUPPORT TO MOVE ON HOLDING UNIT NOT ALLOWED

A unit that is holding cannot receive a support in moving.

Italy: 
A Venice - Trieste
A Tyrolia Supports A Venice - Trieste

Austria: 
A Albania Supports A Trieste - Serbia
A Trieste Hold

The support of the army in Albania fails and the army in Trieste is dislodged by the army from Venice.

#### 6.D.10. TEST CASE, SELF DISLODGMENT PROHIBITED

A unit may not dislodge a unit of the same great power.

Germany: 
A Berlin Hold
F Kiel - Berlin
A Munich Supports F Kiel - Berlin

Move to Berlin fails.

#### 6.D.11. TEST CASE, NO SELF DISLODGMENT OF RETURNING UNIT

Idem.

Germany: 
A Berlin - Prussia
F Kiel - Berlin
A Munich Supports F Kiel - Berlin

Russia: 
A Warsaw - Prussia

Army in Berlin bounces, but is not dislodged by own unit.

#### 6.D.12. TEST CASE, SUPPORTING A FOREIGN UNIT TO DISLODGE OWN UNIT PROHIBITED

You may not help another power in dislodging your own unit.

Austria: 
F Trieste Hold
A Vienna Supports A Venice - Trieste

Italy: 
A Venice - Trieste

No dislodgment of fleet in Trieste.

#### 6.D.13. TEST CASE, SUPPORTING A FOREIGN UNIT TO DISLODGE A RETURNING OWN UNIT PROHIBITED

Idem.

Austria: 
F Trieste - Adriatic Sea
A Vienna Supports A Venice - Trieste

Italy: 
A Venice - Trieste
F Apulia - Adriatic Sea

No dislodgment of fleet in Trieste.

#### 6.D.14. TEST CASE, SUPPORTING A FOREIGN UNIT IS NOT ENOUGH TO PREVENT DISLODGEMENT

If a foreign unit has enough support to dislodge your unit, you may not prevent that dislodgement by supporting the attack.

Austria:
F Trieste Hold
A Vienna Supports A Venice - Trieste

Italy:
A Venice - Trieste
A Tyrolia Supports A Venice - Trieste
F Adriatic Sea Supports A Venice - Trieste

The fleet in Trieste is dislodged.

#### 6.D.15. TEST CASE, DEFENDER CANNOT CUT SUPPORT FOR ATTACK ON ITSELF

A unit that is attacked by a supported unit cannot prevent dislodgement by guessing which of the units will do the support.

Russia: 
F Constantinople Supports F Black Sea - Ankara
F Black Sea - Ankara

Turkey: 
F Ankara - Constantinople

The support of Constantinople is not cut and the fleet in Ankara is dislodged by the fleet in the Black Sea.

#### 6.D.16. TEST CASE, CONVOYING A UNIT DISLODGING A UNIT OF SAME POWER IS ALLOWED

It is allowed to convoy a foreign unit that dislodges your own unit is allowed.

England: 
A London Hold
F North Sea Convoys A Belgium - London

France: 
F English Channel Supports A Belgium - London
A Belgium - London

The English army in London is dislodged by the French army coming from Belgium.

#### 6.D.17. TEST CASE, DISLODGEMENT CUTS SUPPORTS

The famous dislodge rule.

Russia: 
F Constantinople Supports F Black Sea - Ankara
F Black Sea - Ankara

Turkey: 
F Ankara - Constantinople
A Smyrna Supports F Ankara - Constantinople
A Armenia - Ankara

The Russian fleet in Constantinople is dislodged. This cuts the support to from Black Sea to Ankara. Black Sea will bounce with the army from Armenia.

#### 6.D.18. TEST CASE, A SURVIVING UNIT WILL SUSTAIN SUPPORT

Idem. But now with an additional hold that prevents dislodgement.

Russia: 
F Constantinople Supports F Black Sea - Ankara
F Black Sea - Ankara
A Bulgaria Supports F Constantinople

Turkey: 
F Ankara - Constantinople
A Smyrna Supports F Ankara - Constantinople
A Armenia - Ankara

The Russian fleet in the Black Sea will dislodge the Turkish fleet in Ankara.

#### 6.D.19. TEST CASE, EVEN WHEN SURVIVING IS IN ALTERNATIVE WAY

Now, the dislodgement is prevented because the support comes from a Russian army:

Russia: 
F Constantinople Supports F Black Sea - Ankara
F Black Sea - Ankara
A Smyrna Supports F Ankara - Constantinople

Turkey: 
F Ankara - Constantinople

The Russian fleet in Constantinople is not dislodged, because one of the supports is of Russian origin. The support from Black Sea to Ankara will sustain and the fleet in Ankara will be dislodged.

#### 6.D.20. TEST CASE, UNIT CANNOT CUT SUPPORT OF ITS OWN COUNTRY

Although this is not mentioned in all rulebooks, it is generally accepted that when a unit attacks another unit of the same Great Power, it will not cut support.

England: 
F London Supports F North Sea - English Channel
F North Sea - English Channel
A Yorkshire - London

France: 
F English Channel Hold

The army in York does not cut support. This means that the fleet in the English Channel is dislodged by the fleet in the North Sea.

#### 6.D.21. TEST CASE, DISLODGING DOES NOT CANCEL A SUPPORT CUT

Sometimes there is the question whether a dislodged moving unit does not cut support (similar to the dislodge rule). This is not the case.

Austria: 
F Trieste Hold
 
Italy: 
A Venice - Trieste
A Tyrolia Supports A Venice - Trieste
       
Germany: 
A Munich - Tyrolia

Russia: 
A Silesia - Munich
A Berlin Supports A Silesia - Munich

Although the German army is dislodged, it still cuts the Italian support. That means that the Austrian Fleet is not dislodged.

#### 6.D.22. TEST CASE, IMPOSSIBLE FLEET MOVE CANNOT BE SUPPORTED

If a fleet tries moves to a land area it seems pointless to support the fleet, since the move will fail anyway. However, in such case, the support is also invalid for defense purposes.

Germany: 
F Kiel - Munich
A Burgundy Supports F Kiel - Munich

Russia: 
A Munich - Kiel
A Berlin Supports A Munich - Kiel

The German move from Kiel to Munich is illegal (fleets cannot go to Munich). Illegal orders are fully ignored which makes the support from Burgundy also illegal. The Russian army in Munich will dislodge the fleet in Kiel.

#### 6.D.23. TEST CASE, IMPOSSIBLE COAST MOVE CANNOT BE SUPPORTED

Comparable with the previous test case, but now the fleet move is impossible for coastal reasons.

Italy: 
F Gulf of Lyon - Spain(sc)
F Western Mediterranean Supports F Gulf of Lyon - Spain(sc)

France: 
F Spain(nc) - Gulf of Lyon
F Marseilles Supports F Spain(nc) - Gulf of Lyon

The French move from Spain North Coast to Gulf of Lyon is illegal (wrong coast). Therefore, the support from Marseilles fails and the fleet in Spain is dislodged.

#### 6.D.24. TEST CASE, IMPOSSIBLE ARMY MOVE CANNOT BE SUPPORTED

Comparable with the previous test case, but now an army tries to move into sea and the support is used in a beleaguered garrison.

France: 
A Marseilles - Gulf of Lyon
F Spain(sc) Supports A Marseilles - Gulf of Lyon

Italy: 
F Gulf of Lyon Hold

Turkey: 
F Tyrrhenian Sea Supports F Western Mediterranean - Gulf of Lyon
F Western Mediterranean - Gulf of Lyon

The French move from Marseilles to Gulf of Lyon is illegal (an army cannot go to sea). Therefore, the support from Spain fails and there is no beleaguered garrison. The fleet in the Gulf of Lyon is dislodged by the Turkish fleet in the Western Mediterranean.

#### 6.D.25. TEST CASE, FAILING HOLD SUPPORT CAN BE SUPPORTED

If an adjudicator fails on one of the previous three test cases, then the bug should be removed with care. A failing move cannot be supported, but a failing hold support, because of some preconditions (unmatching order) can still be supported.

Germany: 
A Berlin Supports A Prussia
F Kiel Supports A Berlin

Russia: 
F Baltic Sea Supports A Prussia - Berlin
A Prussia - Berlin

Although the support of Berlin on Prussia fails (because of unmatching orders), the support of Kiel on Berlin is still valid. So, Berlin will not be dislodged.

#### 6.D.26. TEST CASE, FAILING MOVE SUPPORT CAN BE SUPPORTED

Similar as the previous test case, but now with an unmatched support to move.

Germany: 
A Berlin Supports A Prussia - Silesia
F Kiel Supports A Berlin

Russia: 
F Baltic Sea Supports A Prussia - Berlin
A Prussia - Berlin

Again, Berlin will not be dislodged.

#### 6.D.27. TEST CASE, FAILING CONVOY CAN BE SUPPORTED

Similar as the previous test case, but now with an unmatched convoy.

England: 
F Sweden - Baltic Sea
F Denmark Supports F Sweden - Baltic Sea

Germany: 
A Berlin Hold

Russia: 
F Baltic Sea Convoys A Berlin - Livonia
F Prussia Supports F Baltic Sea

The convoy order in the Baltic Sea is unmatched and fails. However, the support of Prussia on the Baltic Sea is still valid and the fleet in the Baltic Sea is not dislodged.

#### 6.D.28. TEST CASE, IMPOSSIBLE MOVE AND SUPPORT

An impossible move is "illegal" and should be ignored.

Austria: 
A Budapest Supports F Rumania

Russia: 
F Rumania - Holland

Turkey: 
F Black Sea - Rumania
A Bulgaria Supports F Black Sea - Rumania

See issue [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1). Illegal orders are ignored. Without an order, Rumania holds and receives support. The fleet in Rumania is not dislodged.

#### 6.D.29. TEST CASE, MOVE TO IMPOSSIBLE COAST AND SUPPORT

Similar to the previous test case, but now the move "illegal" due the wrong coast.

Austria: 
A Budapest Supports F Rumania

Russia: 
F Rumania - Bulgaria(sc)

Turkey: 
F Black Sea - Rumania
A Bulgaria Supports F Black Sea - Rumania

See issue [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1). Illegal orders are ignored. Without an order, Rumania holds and receives support. The fleet in Rumania is not dislodged.

#### 6.D.30. TEST CASE, MOVE WITHOUT COAST AND SUPPORT

Similar to the previous test case, but now the move is "illegal" due to missing coast.

Italy: 
F Aegean Sea Supports F Constantinople

Russia: 
F Constantinople - Bulgaria

Turkey: 
F Black Sea - Constantinople
A Bulgaria Supports F Black Sea - Constantinople

See issue [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1). Illegal orders are ignored. Without an order, Constantinople holds and receives support. The fleet in Constantinople is not dislodged.

#### 6.D.31. TEST CASE, A TRICKY IMPOSSIBLE SUPPORT

A support order can be impossible for complex reasons.

Austria: 
A Rumania - Armenia

Turkey: 
F Black Sea Supports A Rumania - Armenia

Although the army in Rumania can move to Armenia and the fleet in the Black Sea can also go to Armenia, the support is still not possible. The reason is that the only possible convoy is through the Black Sea and a fleet cannot convoy and support at the same time.

This is relevant for computer programs that show only the possible orders. In the list of possible orders, the support as given to the fleet in the Black Sea, should not be listed.

Furthermore, the support order should be judged to be illegal, meaning that it is completely ignored. If there is a second order for the Black Sea, that order should be executed (see issue [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1)).

#### 6.D.32. TEST CASE, A MISSING FLEET

The previous test cases contained an order that was impossible even when some other pieces on the board where changed. In this test case, the order is impossible, but only for that situation.

England: 
F Edinburgh Supports A Liverpool - Yorkshire
A Liverpool - Yorkshire

France: 
F London Supports A Yorkshire

Germany: 
A Yorkshire - Holland

The German order to Yorkshire cannot be executed, because there is no fleet in the North Sea. In other situations (where there is a fleet in the North Sea), the exact same order would be possible. This is considered "illegal" (see issue [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1)). The order should be ignored and the support of the French fleet in London succeeds. This means that the army in Yorkshire is not dislodged.

#### 6.D.33. TEST CASE, UNWANTED SUPPORT ALLOWED

A self standoff can be broken by an unwanted support.

Austria: 
A Serbia - Budapest
A Vienna - Budapest

Russia: 
A Galicia Supports A Serbia - Budapest

Turkey: 
A Bulgaria - Serbia

Due to the Russian support, the army in Serbia advances to Budapest. This enables Turkey to capture Serbia with the army in Bulgaria.

#### 6.D.34. TEST CASE, SUPPORT TARGETING OWN AREA NOT ALLOWED

Support targeting the area where the supporting unit is standing, is illegal.

Germany:
A Berlin - Prussia
A Silesia Supports A Berlin - Prussia
F Baltic Sea Supports A Berlin - Prussia

Italy:
A Prussia Supports Livonia - Prussia

Russia:
A Warsaw Supports A Livonia - Prussia
A Livonia - Prussia

Russia and Italy wanted to get rid of the Italian army in Prussia (to build an Italian fleet somewhere else). However, they didn't want a possible German attack on Prussia to succeed. They invented this odd order of Italy. It was intended that the attack of the army in Livonia would have strength three, so it would be capable to prevent the possible German attack to succeed. However, the order of Italy is illegal, because a unit may only support to an area where the unit can go by itself. A unit can't go to the area it is already standing, so the Italian order is illegal and the German move from Berlin succeeds. Even if it would be legal, the German move from Berlin would still succeed, because the support of Prussia is cut by Livonia and Berlin.

### 6.E. TEST CASES, HEAD-TO-HEAD BATTLES AND BELEAGUERED GARRISON

#### 6.E.1. TEST CASE, DISLODGED UNIT HAS NO EFFECT ON ATTACKER'S AREA

An army can follow.

Germany: 
A Berlin - Prussia
F Kiel - Berlin
A Silesia Supports A Berlin - Prussia

Russia: 
A Prussia - Berlin

The army in Kiel will move to Berlin.

#### 6.E.2. TEST CASE, NO SELF DISLODGEMENT IN HEAD-TO-HEAD BATTLE

Self dislodgement is not allowed. This also counts for head-to-head battles.

Germany: 
A Berlin - Kiel
F Kiel - Berlin
A Munich Supports A Berlin - Kiel

No unit will move.

#### 6.E.3. TEST CASE, NO HELP IN DISLODGING OWN UNIT

It is not possible to help a foreign power dislodge own unit in a head-to-head battle.

Germany: 
A Berlin - Kiel
A Munich Supports F Kiel - Berlin

England: 
F Kiel - Berlin

No unit will move.

#### 6.E.4. TEST CASE, NON-DISLODGED LOSER STILL HAS EFFECT

If in an unbalanced head-to-head battle the loser is not dislodged, it still has an effect on the area of the attacker.

Germany: 
F Holland - North Sea
F Helgoland Bight Supports F Holland - North Sea
F Skagerrak Supports F Holland - North Sea

France: 
F North Sea - Holland
F Belgium Supports F North Sea - Holland

England: 
F Edinburgh Supports F Norwegian Sea - North Sea
F Yorkshire Supports F Norwegian Sea - North Sea
F Norwegian Sea - North Sea

Austria: 
A Kiel Supports A Ruhr - Holland
A Ruhr - Holland

The French fleet in the North Sea is not dislodged due to the beleaguered garrison. Therefore, the Austrian army in Ruhr will not move to Holland.

#### 6.E.5. TEST CASE, LOSER DISLODGED BY ANOTHER ARMY STILL HAS EFFECT

If in an unbalanced head-to-head battle the loser is dislodged by a unit not part of the head-to-head battle, the loser still has an effect on the area of the winner of the head-to-head battle.

Germany: 
F Holland - North Sea
F Helgoland Bight Supports F Holland - North Sea
F Skagerrak Supports F Holland - North Sea

France: 
F North Sea - Holland
F Belgium Supports F North Sea - Holland

England: 
F Edinburgh Supports F Norwegian Sea - North Sea
F Yorkshire Supports F Norwegian Sea - North Sea
F Norwegian Sea - North Sea
F London Supports F Norwegian Sea - North Sea

Austria: 
A Kiel Supports A Ruhr - Holland
A Ruhr - Holland

The French fleet in the North Sea is dislodged but not by the German fleet in Holland. Therefore, the French fleet can still prevent that the Austrian army in Ruhr will move to Holland. So, the Austrian move in Ruhr fails and the German fleet in Holland is not dislodged.

#### 6.E.6. TEST CASE, NOT DISLODGE BECAUSE OF OWN SUPPORT STILL HAS EFFECT

If in an unbalanced head-to-head battle the loser is not dislodged because the winner had help of a unit of the loser, the loser still has an effect on the area of the winner.

Germany: 
F Holland - North Sea
F Helgoland Bight Supports F Holland - North Sea

France: 
F North Sea - Holland
F Belgium Supports F North Sea - Holland
F English Channel Supports F Holland - North Sea

Austria: 
A Kiel Supports A Ruhr - Holland
A Ruhr - Holland

Although the German force from Holland to North Sea is one larger than the French force from North Sea to Holland, the French fleet in the North Sea is not dislodged, because one of the supports on the German movement is French. Therefore, the Austrian army in Ruhr will not move to Holland.

#### 6.E.7. TEST CASE, NO SELF DISLODGEMENT WITH BELEAGUERED GARRISON

An attempt at self dislodgement can be combined with a beleaguered garrison. Such self dislodgment is still not possible.

England: 
F North Sea Hold
F Yorkshire Supports F Norway - North Sea

Germany: 
F Holland Supports F Helgoland Bight - North Sea
F Helgoland Bight - North Sea

Russia: 
F Skagerrak Supports F Norway - North Sea
F Norway - North Sea

Although the Russians beat the German attack (with the support of Yorkshire) and the two Russian fleets are enough to dislodge the fleet in the North Sea, the fleet in the North Sea is not dislodged, since it would not be dislodged if the English fleet in Yorkshire would not give support. This is a typical bug that can happen if a grand winner is calculated of a contested area (instead of calculating every move separately). Of the contested area the North Sea, the Russians are the grand winner with a strength of three, but this doesn't mean that they can advance.

#### 6.E.8. TEST CASE, NO SELF DISLODGEMENT WITH BELEAGUERED GARRISON AND HEAD-TO-HEAD BATTLE

Similar to the previous test case, but now the beleaguered fleet is also engaged in a head-to-head battle.

England: 
F North Sea - Norway
F Yorkshire Supports F Norway - North Sea

Germany: 
F Holland Supports F Helgoland Bight - North Sea
F Helgoland Bight - North Sea

Russia: 
F Skagerrak Supports F Norway - North Sea
F Norway - North Sea

Again, none of the fleets move.

#### 6.E.9. TEST CASE, ALMOST SELF DISLODGEMENT WITH BELEAGUERED GARRISON

Similar to the previous test case, but now the beleaguered fleet is moving away.

England: 
F North Sea - Norwegian Sea
F Yorkshire Supports F Norway - North Sea

Germany: 
F Holland Supports F Helgoland Bight - North Sea
F Helgoland Bight - North Sea

Russia: 
F Skagerrak Supports F Norway - North Sea
F Norway - North Sea

Both the fleet in the North Sea and the fleet in Norway move.

#### 6.E.10. TEST CASE, ALMOST CIRCULAR MOVEMENT WITH NO SELF DISLODGEMENT WITH BELEAGUERED GARRISON

Similar to the previous test case, but now the beleaguered fleet is in circular movement with the weaker attacker. So, the circular movement fails.

England: 
F North Sea - Denmark
F Yorkshire Supports F Norway - North Sea

Germany: 
F Holland Supports F Helgoland Bight - North Sea
F Helgoland Bight - North Sea
F Denmark - Helgoland Bight

Russia: 
F Skagerrak Supports F Norway - North Sea
F Norway - North Sea

There is no movement of fleets.

#### 6.E.11. TEST CASE, NO SELF DISLODGEMENT WITH BELEAGUERED GARRISON, UNIT SWAP WITH ADJACENT CONVOYING AND TWO COASTS

Similar to the previous test case, but now the beleaguered fleet is in a unit swap with the stronger attacker. So, the unit swap succeeds. To make the situation more complex, the swap is on an area with two coasts.

France: 
A Spain - Portugal via convoy
F Mid-Atlantic Ocean Convoys A Spain - Portugal
F Gulf of Lyon Supports F Portugal - Spain(nc)

Germany: 
A Marseilles Supports A Gascony - Spain
A Gascony - Spain

Italy: 
F Portugal - Spain(nc)
F Western Mediterranean Supports F Portugal - Spain(nc)

The unit swap succeeds. Note that due to the success of the swap, there is no beleaguered garrison anymore.

#### 6.E.12. TEST CASE, SUPPORT ON ATTACK ON OWN UNIT CAN BE USED FOR OTHER MEANS

A support on an attack on your own unit still has an effect. It can prevent that another army will dislodge the unit.

Austria: 
A Budapest - Rumania
A Serbia Supports A Vienna - Budapest

Italy: 
A Vienna - Budapest

Russia: 
A Galicia - Budapest
A Rumania Supports A Galicia - Budapest

The support of Serbia on the Italian army prevents that the Russian army in Galicia will advance. No army will move.

#### 6.E.13. TEST CASE, THREE WAY BELEAGUERED GARRISON

In a beleaguered garrison from three sides, the adjudicator may not let two attacks fail and then let the third succeed.

England: 
F Edinburgh Supports F Yorkshire - North Sea
F Yorkshire - North Sea

France: 
F Belgium - North Sea
F English Channel Supports F Belgium - North Sea

Germany: 
F North Sea Hold

Russia: 
F Norwegian Sea - North Sea
F Norway Supports F Norwegian Sea - North Sea

None of the fleets move. The German fleet in the North Sea is not dislodged.

#### 6.E.14. TEST CASE, ILLEGAL HEAD-TO-HEAD BATTLE CAN STILL DEFEND

If in a head-to-head battle, one of the units makes an illegal move, then that unit still has the possibility to defend against attacks with strength of one.

England: 
A Liverpool - Edinburgh

Russia: 
F Edinburgh - Liverpool

The move of the Russian fleet is illegal, but can still prevent the English army from entering Edinburgh. So, none of the units move.

#### 6.E.15. TEST CASE, THE FRIENDLY HEAD-TO-HEAD BATTLE

In this case each unit in the head-to-head battle prevents that the other unit from being dislodged.

England:
F Holland Supports A Ruhr - Kiel
A Ruhr - Kiel

France:
A Kiel - Berlin
A Munich Supports A Kiel - Berlin
A Silesia Supports A Kiel - Berlin

Germany:
A Berlin - Kiel
F Denmark Supports A Berlin - Kiel
F Helgoland Bight Supports A Berlin - Kiel

Russia:
F Baltic Sea Supports A Prussia - Berlin
A Prussia - Berlin

None of the moves succeeds. This case is especially difficult for sequence based adjudicators. They will start adjudicating the head-to-head battle and continue to adjudicate the attack on one of the units which is part of the head-to-head battle. In this process, one of the sides of the head-to-head battle might be cancelled out.

### 6.F. TEST CASES, CONVOYS

#### 6.F.1. TEST CASE, NO CONVOY IN COASTAL AREAS

A fleet in a coastal area may not convoy.

Turkey: 
A Greece - Sevastopol
F Aegean Sea Convoys A Greece - Sevastopol
F Constantinople Convoys A Greece - Sevastopol
F Black Sea Convoys A Greece - Sevastopol

The convoy in Constantinople is not possible. So, the army in Greece will not move to Sevastopol.

#### 6.F.2. TEST CASE, AN ARMY BEING CONVOYED CAN BOUNCE AS NORMAL

Armies being convoyed bounce on other units just as armies that are not being convoyed.

England: 
F English Channel Convoys A London - Brest
A London - Brest

France: 
A Paris - Brest

The English army in London bounces on the French army in Paris. Both units do not move.

#### 6.F.3. TEST CASE, AN ARMY BEING CONVOYED CAN RECEIVE SUPPORT

Armies being convoyed can receive support as in any other move.

England: 
F English Channel Convoys A London - Brest
A London - Brest
F Mid-Atlantic Ocean Supports A London - Brest

France: 
A Paris - Brest

The army in London receives support and beats the army in Paris. This means that the army London will end in Brest and the French army in Paris stays in Paris.

#### 6.F.4. TEST CASE, AN ATTACKED CONVOY IS NOT DISRUPTED

A convoy can only be disrupted by dislodging the fleets. Attacking is not sufficient.

England: 
F North Sea Convoys A London - Holland
A London - Holland

Germany: 
F Skagerrak - North Sea

The army in London will successfully convoy and end in Holland.

#### 6.F.5. TEST CASE, A BELEAGUERED CONVOY IS NOT DISRUPTED

Even when a convoy is in a beleaguered garrison it is not disrupted.

England: 
F North Sea Convoys A London - Holland
A London - Holland

France: 
F English Channel - North Sea
F Belgium Supports F English Channel - North Sea

Germany: 
F Skagerrak - North Sea
F Denmark Supports F Skagerrak - North Sea

The army in London will successfully convoy and end in Holland.

#### 6.F.6. TEST CASE, DISLODGED CONVOY DOES NOT CUT SUPPORT

When a fleet of a convoy is dislodged, the convoy is completely cancelled. So, no support is cut.

England: 
F North Sea Convoys A London - Holland
A London - Holland

Germany: 
A Holland Supports A Belgium
A Belgium Supports A Holland
F Helgoland Bight Supports F Skagerrak - North Sea
F Skagerrak - North Sea

France: 
A Picardy - Belgium
A Burgundy Supports A Picardy - Belgium

The hold order of Holland on Belgium will sustain and Belgium will not be dislodged by the French in Picardy.

#### 6.F.7. TEST CASE, DISLODGED CONVOY DOES NOT CAUSE CONTESTED AREA

When a fleet of a convoy is dislodged, the landing area is not contested, so other units can retreat to that area.

England: 
F North Sea Convoys A London - Holland
A London - Holland

Germany: 
F Helgoland Bight Supports F Skagerrak - North Sea
F Skagerrak - North Sea

The dislodged English fleet can retreat to Holland.

#### 6.F.8. TEST CASE, DISLODGED CONVOY DOES NOT CAUSE A BOUNCE

When a fleet of a convoy is dislodged, then there will be no bounce in the landing area.

England: 
F North Sea Convoys A London - Holland
A London - Holland

Germany: 
F Helgoland Bight Supports F Skagerrak - North Sea
F Skagerrak - North Sea
A Belgium - Holland

The army in Belgium will not bounce and move to Holland.

#### 6.F.9. TEST CASE, DISLODGE OF MULTI-ROUTE CONVOY

When a fleet of a convoy with multiple routes is dislodged, the result depends on the rulebook that is used.

England: 
F English Channel Convoys A London - Belgium
F North Sea Convoys A London - Belgium
A London - Belgium

France: 
F Brest Supports F Mid-Atlantic Ocean - English Channel
F Mid-Atlantic Ocean - English Channel

The French fleet in Mid Atlantic Ocean will dislodge the convoying fleet in the English Channel.

If the 1971 rules are used (see issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)), this will disrupt the convoy and the army will stay in London.

When later rulebooks are used (_which I prefer_) the army can still go via the North Sea and the convoy succeeds and the London army will end in Belgium.

#### 6.F.10. TEST CASE, DISLODGE OF MULTI-ROUTE CONVOY WITH FOREIGN FLEET

When the 1971 rulebook is used "unwanted" multi-route convoys are possible.

England: 
F North Sea Convoys A London - Belgium
A London - Belgium

Germany: 
F English Channel Convoys A London - Belgium

France: 
F Brest Supports F Mid-Atlantic Ocean - English Channel
F Mid-Atlantic Ocean - English Channel

The same as in the previous test case, the French fleet in Mid Atlantic Ocean will dislodge the convoying fleet in the English Channel.

If the 1971 rules are used (see issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)), this will disrupt the convoy and the army will stay in London. Without the "help" of the Germans the convoy would have succeeded!

When later rulebooks are used (_which I prefer_) the army can still go via the North Sea and the convoy succeeds and the London army will end in Belgium.

#### 6.F.11. TEST CASE, DISLODGE OF MULTI-ROUTE CONVOY WITH ONLY FOREIGN FLEETS

With the 1971 rulebook one could adopt a rule (DPTG) that foreign fleets are not used when not necessary, but this doesn't prevent an "unwanted" convoy when all convoying fleets are foreign.

England: 
A London - Belgium

Germany: 
F English Channel Convoys A London - Belgium

Russia: 
F North Sea Convoys A London - Belgium

France: 
F Brest Supports F Mid-Atlantic Ocean - English Channel
F Mid-Atlantic Ocean - English Channel

Again, the French fleet in Mid Atlantic Ocean will dislodge the convoying fleet in the English Channel.

If the 1971 rules are used (see issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)), this will disrupt the convoy and the army will stay in London.

When later rulebooks are used (_which I prefer_) the army can still go via the North Sea and the convoy succeeds and the London army will end in Belgium.

#### 6.F.12. TEST CASE, DISLODGED CONVOYING FLEET NOT ON ROUTE

When the rule is used that convoys are disrupted when one of the routes is disrupted (see issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)), the convoy is not necessarily disrupted when one of the fleets ordered to convoy is dislodged.

England: 
F English Channel Convoys A London - Belgium
A London - Belgium
F Irish Sea Convoys A London - Belgium

France: 
F North Atlantic Ocean Supports F Mid-Atlantic Ocean - Irish Sea
F Mid-Atlantic Ocean - Irish Sea

Even when convoys are disrupted when one of the routes is disrupted (see issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)), the convoy from London to Belgium will still succeed, since the dislodged fleet in the Irish Sea is not part of any route, although it can be reached from the starting point London.

#### 6.F.13. TEST CASE, THE UNWANTED ALTERNATIVE

This situation is not difficult to adjudicate, but it shows that even if someone wants to convoy, the player might not want an alternative route for the convoy.

England: 
A London - Belgium
F North Sea Convoys A London - Belgium

France: 
F English Channel Convoys A London - Belgium

Germany: 
F Holland Supports F Denmark - North Sea
F Denmark - North Sea

If France and German are allies, England want to keep its army in London, to defend the island. An army in Belgium could easily be destroyed by an alliance of France and Germany. England tries to be friends with Germany, however France and Germany trick England.

The convoy of the army in London succeeds and the fleet in Denmark dislodges the fleet in the North Sea.

#### 6.F.14. TEST CASE, SIMPLE CONVOY PARADOX

The most common paradox is when the attacked unit supports an attack on one of the convoying fleets.

England: 
F London Supports F Wales - English Channel
F Wales - English Channel

France: 
A Brest - London
F English Channel Convoys A Brest - London

See issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)

According to all rulebooks (_including the Szykman rule which I prefer_), the support of London is not cut. That means that the fleet in the English Channel is dislodged.

#### 6.F.15. TEST CASE, SIMPLE CONVOY PARADOX WITH ADDITIONAL CONVOY

Paradox rules only apply on the paradox core.

England: 
F London Supports F Wales - English Channel
F Wales - English Channel

France: 
A Brest - London
F English Channel Convoys A Brest - London

Italy: 
F Irish Sea Convoys A North Africa - Wales
F Mid-Atlantic Ocean Convoys A North Africa - Wales
A North Africa - Wales

The adjudication of the paradox in the English Channel should not interfere with the adjudication of the Italian convoy. Both the fleet in Wales as the army in North Africa succeed in moving.

#### 6.F.16. TEST CASE, PANDIN'S PARADOX

In Pandin's paradox, the attacked unit protects the convoying fleet by a beleaguered garrison.

England: 
F London Supports F Wales - English Channel
F Wales - English Channel

France: 
A Brest - London
F English Channel Convoys A Brest - London

Germany: 
F North Sea Supports F Belgium - English Channel
F Belgium - English Channel

See issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)

According to all rulebooks (_including the Szykman rule which I prefer_), the support of London is not cut. That means that the fleet in the English Channel is not dislodged and none of the units succeed to move.

#### 6.F.17. TEST CASE, PANDIN'S EXTENDED PARADOX

In Pandin's extended paradox, the attacked unit protects the convoying fleet by a beleaguered garrison and the attacked unit can dislodge the unit that gives the protection.

England: 
F London Supports F Wales - English Channel
F Wales - English Channel

France: 
A Brest - London
F English Channel Convoys A Brest - London
F Yorkshire Supports A Brest - London

Germany: 
F North Sea Supports F Belgium - English Channel
F Belgium - English Channel

When the 1971/1982/2000/2023 rules are used (see issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)), the support of London is not cut. That means that the fleet in the English Channel is not dislodged. The convoy will succeed and dislodge the fleet in London. One can argue that this violates the dislodge rule, but one may assume that the paradox convoy rule take precedence over the dislodge rule.

If the Simon Szykman alternative is used (_which I prefer_), the convoy fails and the fleet in London and the English Channel are not dislodged (_which I think is a more appealing adjudication_).

#### 6.F.18. TEST CASE, BETRAYAL PARADOX

The betrayal paradox is comparable to Pandin's paradox, but now the attacked unit directly supports the convoying fleet. Of course, this will only happen when the player of the attacked unit is betrayed.

England: 
F North Sea Convoys A London - Belgium
A London - Belgium
F English Channel Supports A London - Belgium

France: 
F Belgium Supports F North Sea

Germany: 
F Helgoland Bight Supports F Skagerrak - North Sea
F Skagerrak - North Sea

If the English convoy from London to Belgium is successful, then it cuts the France support necessary to hold the fleet in the North Sea (see issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)).

The 1971, 2000 and 2023 rules do not give an answer on this.

According to the 1982 rules the French support on the North Sea will not be cut. So, the fleet in the North Sea will not be dislodged by the Germans and the army in London will dislodge the French army in Belgium.

If the Szykman rule is followed (_which I prefer_), the convoy in the English Channel fails. Without the convoy, the move of the army in London will fail and the support in Belgium will not be cut. That means that the fleet in the North Sea will not be dislodged.

#### 6.F.19. TEST CASE, MULTI-ROUTE CONVOY DISRUPTION PARADOX

The situation becomes more complex when the convoy has alternative routes.

France: 
A Tunis - Naples
F Tyrrhenian Sea Convoys A Tunis - Naples
F Ionian Sea Convoys A Tunis - Naples

Italy: 
F Naples Supports F Rome - Tyrrhenian Sea
F Rome - Tyrrhenian Sea

Now, two issues play a role. The rule about disruption of multi-route convoys (issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)) and the determination of how paradoxes are resolved (issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)).

If the 1971 rulebook is used then a multi-route convoy is disrupted when one of the routes is disrupted. That makes this situation paradoxical and the 1971 paradox rule kicks in. The support of the fleet in Naples is not cut and the fleet in Rome dislodges the fleet in the Tyrrhenian Sea.

With the 1982 rulebook, the support of Naples is not cut, because it is supporting an action in a body of water that contains a convoying fleet. This means that the fleet in Rome dislodges the fleet in the Tyrrhenian Sea.

According to the 2000/2023 rules the fleet in the Tyrrhenian Sea is not "necessary" for the convoy and the support of Naples is cut and the fleet in the Tyrrhenian Sea is not dislodged.

If the Szykman rule is used (_which I prefer_), then there is no paradoxical situation. The support of Naples is cut (the same as in the 2000/2023 ruling) and the fleet in the Tyrrhenian Sea is not dislodged.

#### 6.F.20. TEST CASE, UNWANTED MULTI-ROUTE CONVOY PARADOX

The 1982 paradox rule allows some creative defense.

France: 
A Tunis - Naples
F Tyrrhenian Sea Convoys A Tunis - Naples

Italy: 
F Naples Supports F Ionian Sea
F Ionian Sea Convoys A Tunis - Naples

Turkey: 
F Aegean Sea Supports F Eastern Mediterranean - Ionian Sea
F Eastern Mediterranean - Ionian Sea

Again, two issues play a role. The rule about disruption of multi-route convoys (issue [4.A.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.1)) and the determination of how paradoxes are resolved (issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)).

If the 1971 rulebook is used, then a multi-route convoy is disrupted when one of the routes is disrupted. This makes the situation paradoxical. However, since the fleet in Naples is not supporting an attack on a convoying fleet, the paradox rule does not apply and the 1971 rules do not give answer to this situation.

With the 1982 rules the support in Naples is not cut, because it is supporting an action in a body of water that contains a convoying fleet. That means that the fleet in the Ionian Sea is not dislodged.

The paradox rule of the 2000/2023 rules, does not kick in, because the support is not a support that attacks the convoying fleet. However, with these rules a multi-route convoy is only disrupted when all routes are disrupted, which prevents that this situation is a paradox. So, the support of Naples is cut and the fleet in the Ionian Sea is dislodged by the Turkish fleet in the Eastern Mediterranean.

If the Szykman rule is used, then there is no paradoxical situation. The support of Naples is cut and the fleet in the Ionian Sea is dislodged by the Turkish fleet in the Eastern Mediterranean.

_As you can see, the 1982 rules allow the Italian player to save its fleet in the Ionian Sea with a trick. I do not consider this trick as normal tactical play. I prefer the Szykman rule as one of the rules that does not allow this trick. According to this rule the fleet in the Ionian Sea is dislodged._

#### 6.F.21. TEST CASE, DAD'S ARMY CONVOY

The 1982 paradox rule has as side effect that convoying armies do not cut support in some situations that are not paradoxical.

Russia: 
A Edinburgh Supports A Norway - Clyde
F Norwegian Sea Convoys A Norway - Clyde
A Norway - Clyde

France: 
F Irish Sea Supports F Mid-Atlantic Ocean - North Atlantic Ocean
F Mid-Atlantic Ocean - North Atlantic Ocean

England: 
A Liverpool - Clyde via convoy
F North Atlantic Ocean Convoys A Liverpool - Clyde
F Clyde Supports F North Atlantic Ocean

In all rules, except the 1982 paradox rule, the support of the fleet in Clyde on the North Atlantic Ocean is cut and the French fleet in the Mid-Atlantic Ocean will dislodge the fleet in the North Atlantic Ocean. This is the preferred way.

However, in the 1982 paradox rule (see issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)), the support of the fleet in Clyde is not cut. That means that the English fleet in the North Atlantic Ocean is not dislodged.

_As you can see, the 1982 rule allows England to save its fleet in the North Atlantic Ocean in a very strange way. Just the support of Clyde is insufficient (if there is no convoy, the support is cut). Only the convoy to the area occupied by own unit, can do the trick in this situation. The embarking of troops in the fleet deceives the enemy so much that it works as a magic cloak. The enemy is not able to dislodge the fleet in the North Atlantic Ocean any more. Of course, this will only work in comedies. I prefer the Szykman rule as one of the rules that does not allow this trick. According to this rule (and all other paradox rules), the fleet in the North Atlantic is just dislodged._

#### 6.F.22. TEST CASE, SECOND ORDER PARADOX WITH TWO RESOLUTIONS

Two convoys are involved in a second order paradox.

England: 
F Edinburgh - North Sea
F London Supports F Edinburgh - North Sea

France: 
A Brest - London
F English Channel Convoys A Brest - London

Germany: 
F Belgium Supports F Picardy - English Channel
F Picardy - English Channel

Russia: 
A Norway - Belgium
F North Sea Convoys A Norway - Belgium

Without any paradox rule, there are two consistent resolutions. The supports of the English fleet in London and the German fleet in Picardy are not cut. That means that the French fleet in the English Channel and the Russian fleet in the North Sea are dislodged, which makes it impossible to cut the support. The other resolution is that the supports of the English fleet in London the German fleet in Picardy are cut. In that case the French fleet in the English Channel and the Russian fleet in the North Sea will survive and will not be dislodged. This gives the possibility to cut the support.

The 1971, 2000 and 2023 rules (see issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)) do not have an answer on this.

According to the 1982 rule, the supports are not cut which means that the French fleet in the English Channel and the Russian fleet in the North Sea are dislodged.

The Szykman (_which I prefer_), has the same result as the 1982 rule. The supports are not cut, the convoying armies fail to move, the fleet in Picardy dislodges the fleet in English Channel and the fleet in Edinburgh dislodges the fleet in the North Sea.

#### 6.F.23. TEST CASE, SECOND ORDER PARADOX WITH TWO EXCLUSIVE CONVOYS

In this paradox there are two consistent resolutions, but where the two convoys do not fail or succeed at the same time.

England: 
F Edinburgh - North Sea
F Yorkshire Supports F Edinburgh - North Sea

France: 
A Brest - London
F English Channel Convoys A Brest - London

Germany: 
F Belgium Supports F English Channel
F London Supports F North Sea

Italy: 
F Mid-Atlantic Ocean - English Channel
F Irish Sea Supports F Mid-Atlantic Ocean - English Channel

Russia: 
A Norway - Belgium
F North Sea Convoys A Norway - Belgium

Without any paradox rule, there are two consistent resolutions. In one resolution, the convoy in the English Channel is dislodged by the fleet in the Mid-Atlantic Ocean, while the convoy in the North Sea succeeds. In the other resolution, it is the other way around. The convoy in the North Sea is dislodged by the fleet in Edinburgh, while the convoy in the English Channel succeeds.

The 1971, 2000 and 2023 rules (see issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)) do not have an answer on this.

According to the 1982 rule, the supports are not cut which means that the none of the units move.

The Szykman rule (_which I prefer_), has the same result as the 1982 rule. The convoying armies fail to move and the supports are not cut. Because of the failure to cut the support, no fleet succeeds to move.

#### 6.F.24. TEST CASE, SECOND ORDER PARADOX WITH NO RESOLUTION

As first order paradoxes, second order paradoxes come in two flavors, with two resolutions or no resolution.

England: 
F Edinburgh - North Sea
F London Supports F Edinburgh - North Sea
F Irish Sea - English Channel
F Mid-Atlantic Ocean Supports F Irish Sea - English Channel

France: 
A Brest - London
F English Channel Convoys A Brest - London
F Belgium Supports F English Channel

Russia: 
A Norway - Belgium
F North Sea Convoys A Norway - Belgium

When no paradox rule is used, there is no consistent resolution. If the French support in Belgium is cut, the French fleet in the English Channel will be dislodged. That means that the support of London will not be cut and the fleet in Edinburgh will dislodge the Russian fleet in the North Sea. In this way the support in Belgium is not cut! But if the support in Belgium is not cut, the Russian fleet in the North Sea will not be dislodged and the army in Norway can cut the support in Belgium.

The 1971, 2000 and 2023 rules (see issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2)) do not have an answer on this.

According to the 1982 rule, the supports are not cut which means that the French fleet in the English Channel will survive and but the Russian fleet in the North Sea is dislodged.

If the Szykman alternative is used (_which I prefer_), the supports are not cut and the convoying armies fail to move, which gives the same result as the 1982 rule.

#### 6.F.25. TEST CASE, CUT SUPPORT LAST

For manual play the rule of thumb is, cut support first. However, in below example the support of Holland is some of the last orders to adjudicated.

Germany:
A Rhur - Belgium
A Holland Supports Rhur - Belgium
A Denmark - Norway
F Skagerrak Convoys Denmark - Norway
A Finland Supports Denmark - Norway

England:
A Yorkshire - Holland
F North Sea Convoys Yorkshire - Holland
F Helgoland Bight Supports Yorkshire - Holland
A Belgium Hold

Russia:
F Norwegian Sea - North Sea
F Norway Supports Norwegian Sea - North Sea
F Sweden - Skagerrak

The fleet in Sweden fails to disrupt the convoy in Skagerrak. The move from Denmark to Norway succeeds and cuts the support of Norway. The fleet in the Norwegian Sea fails to disrupt the convoy in North Sea. The move from Yorkshire to Holland succeeds and cuts the support of Holland. The move from Rhur fails to dislodge the army in Belgium.

### 6.G. TEST CASES, CONVOYING TO ADJACENT PROVINCES

#### 6.G.1. TEST CASE, TWO UNITS CAN SWAP PROVINCES BY CONVOY

The only way to swap two units, is by convoy.

England: 
A Norway - Sweden
F Skagerrak Convoys A Norway - Sweden

Russia: 
A Sweden - Norway

If explicit adjacent convoying is used (DPTG, see issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3)), then it is just a head-to-head battle. However, all rulebooks (_which I prefer_) allow that convoy intent is given by a convoying fleet of same country. So, swap should happen.

#### 6.G.2. TEST CASE, KIDNAPPING AN ARMY

Germany promised England to support to dislodge the Russian fleet in Sweden and it promised Russia to support to dislodge the English army in Norway. Instead, the joking German orders a convoy.

England: 
A Norway - Sweden

Russia: 
F Sweden - Norway

Germany: 
F Skagerrak Convoys A Norway - Sweden

See issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3). If the 1971 rulebook is used, then the army in Norway is kidnapped and swaps with the army in Sweden. In all other rulebooks (_which I prever_), kidnapping is prevented and the armies fail to move.

#### 6.G.3. TEST CASE, AN UNWANTED DISRUPTED CONVOY TO ADJACENT PROVINCE

One can try to convoy an army unwanted with a fleet that is almost certainly dislodged. However, this trick should not work.

France: 
F Brest - English Channel
A Picardy - Belgium
A Burgundy Supports A Picardy - Belgium
F Mid-Atlantic Ocean Supports F Brest - English Channel
 
England: 
F English Channel Convoys A Picardy - Belgium

See issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3). The 1982/2000/2023 rulebooks (_which I prefer_) will only use the convoy route if intent is clear. The army in Picardy will successfully move by land route to Belgium. In case of the 1971 rulebook it is less clear. However, since no unit in Belgium moves in opposite direction the convoy should be ignored, resulting in the same adjudication.

#### 6.G.4. TEST CASE, AN UNWANTED DISRUPTED CONVOY TO ADJACENT PROVINCE AND OPPOSITE MOVE

In the situation of the previous test case, it was rather clear that the army didn't want to take the convoy. But what if there is an army moving in opposite direction?

France: 
F Brest - English Channel
A Picardy - Belgium
A Burgundy Supports A Picardy - Belgium
F Mid-Atlantic Ocean Supports F Brest - English Channel
 
England: 
F English Channel Convoys A Picardy - Belgium
A Belgium - Picardy

See issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3). In case of the 1971 rules, it is not directly clear whether the French army in Picardy will take the land route. However, if unwanted convoys are prevented as much as possible, it will not take the convoy if it is disrupted. So, the move of the army in Picardy will succeed.

With the 1982/2000/2023 rulebooks (_which I prefer_) and with explicit adjacent convoying, kidnapping is prevented and the French army will successfully move.

#### 6.G.5. TEST CASE, SWAPPING WITH MULTIPLE FLEETS WITH ONE OWN FLEET

One fleet is sufficient to show the intent to convoy.

Italy: 
A Rome - Apulia
F Tyrrhenian Sea Convoys A Apulia - Rome

Turkey:  
A Apulia - Rome
F Ionian Sea Convoys A Apulia - Rome

If explicit adjacent convoying is used (DPTG, see issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3)), then it is just a head-to-head battle. However, all rulebooks (_which I prefer_) allow that convoy intent is given by a convoying fleet of same country. So, the swap should happen.

#### 6.G.6. TEST CASE, SWAPPING WITH UNINTENDED INTENT

The intent is questionable.

England: 
A Liverpool - Edinburgh
F English Channel Convoys A Liverpool - Edinburgh

Germany: 
A Edinburgh - Liverpool

France: 
F Irish Sea Hold
F North Sea Hold

Russia: 
F Norwegian Sea Convoys A Liverpool - Edinburgh
F North Atlantic Ocean Convoys A Liverpool - Edinburgh

Here England intended to convoy via the French fleets in the Irish Sea and the North Sea. However, the French did not order the convoy. The alternative route with the Russian fleets was unintended. The English fleet in the English Channel (with the convoy order) is not part of this alternative route with the Russian fleets.

See issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3).

If the 1971 rules are used, the intent is not important and the units are swapped.

In case of the 1982/2000/2023 rulebooks (_which I prefer_) England still intents to convoy and the armies should swap.

When explicit adjacent convoying is used (DPTG), then the English army did not receive an order to move by convoy. So, it is just a head-to-head battle and both the army in Edinburgh and Liverpool will not move.

#### 6.G.7. TEST CASE, SWAPPING WITH ILLEGAL INTENT

Can the intent be made clear with an impossible order?

England: 
F Skagerrak Convoys A Sweden - Norway
F Norway - Sweden

Russia: 
A Sweden - Norway
F Gulf of Bothnia Convoys A Sweden - Norway

See issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3) and [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1).

In case the 1971 rules are used, the intent is not important and the units in Norway and Sweden swap.

With the 2023 rules (_which I prefer_) impossible orders are ignored. Also, with modern webbased adjudicators, impossible orders cannot be given at all. With this, there is no intent to convoy and the units in Norway and Sweden fail to move.

If explicit adjacent convoying is used (DPTG) there is also no convoy and none of the units move.

#### 6.G.8. TEST CASE, EXPLICIT CONVOY THAT ISN'T THERE

What to do when a unit is explicitly ordered to move via convoy and the convoy is not there?

France: 
A Belgium - Holland via convoy

England: 
F North Sea - Helgoland Bight
A Holland - Kiel

The French army in Belgium intended to move convoyed with the English fleet in the North Sea. But England changed its plans.

See issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3).

In case of 1971 or 1982 rulebook, this test case not applicable, because they don't have the notion of 'via convoy'.

For the 2000/2023 rulebook and the DPTG, the question is whether the land route should be used as "fallback".

_As discussed in the issue, I don't prefer fallback anymore._

#### 6.G.9. TEST CASE, SWAPPED OR DISLODGED?

In the following situation the English army in Norway will end in all cases in Sweden. But whether it is convoyed or not has effect on the Russian army. In case of convoy the Russian army ends in Norway and in case of a land route the Russian army is dislodged (see issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3)).

England: 
A Norway - Sweden
F Skagerrak Convoys A Norway - Sweden
F Finland Supports A Norway - Sweden

Russia: 
A Sweden - Norway

If played according to the DPTG, then an army is only convoyed to an adjacent province if it is tagged with "via convoy". This means that the Russian army in Sweden is dislodged by the army from Norway.

If played according to any of the rulebooks (_which I prefer_) then the move of Norway is via convoy and the armies swap.

#### 6.G.10. TEST CASE, SWAPPED OR AN HEAD-TO-HEAD BATTLE?

Can a dislodged unit have effect on the attacker's area, when the attacker moved by convoy?

England: 
A Norway - Sweden via convoy
F Denmark Supports A Norway - Sweden
F Finland Supports A Norway - Sweden

Germany:
F Skagerrak Convoys A Norway - Sweden
 
Russia: 
A Sweden - Norway
F Barents Sea Supports A Sweden - Norway

France: 
F Norwegian Sea - Norway
F North Sea Supports F Norwegian Sea - Norway

Since England ordered the army in Norway to move explicitly via convoy and the army in Sweden is moving in opposite direction, there is no head-to-head battle. It is clear that the army in Norway will dislodge the Russian army in Sweden. Since the strength of three is in all cases the strongest force.

The army in Sweden will not advance to Norway, because it cannot beat the force in the Norwegian Sea. It will be dislodged by the army from Norway.

The more interesting question is whether the French fleet in the Norwegian Sea is bounced by the Russian army from Sweden. This depends on the interpretation of issue [4.A.7](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.7). If the rulebook is taken literally (choice a), then a dislodged unit cannot bounce a unit in the area where the attacker came from. This would mean that the move of the fleet in the Norwegian Sea succeeds. However, if choice b is taken (_which I prefer_), then a bounce is still possible, when there is no head-to-head battle. So, the fleet in the Norwegian Sea will fail to move.

#### 6.G.11. TEST CASE, A CONVOY TO AN ADJACENT PROVINCE WITH A PARADOX

In this case the convoy route is available when the land route is chosen and the convoy route is not available when the convoy route is chosen.

England: 
F Norway Supports F North Sea - Skagerrak
F North Sea - Skagerrak

Russia: 
A Sweden - Norway
F Skagerrak Convoys A Sweden - Norway
F Barents Sea Supports A Sweden - Norway

See issue [4.A.2](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.2) and [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3).

In case of the 1971 rulebook the move from Sweden to Norway is not a convoy (because Norway is not moving in opposite direction) and the English fleet in Norway is dislodged and the fleet in Skagerrak will not be dislodged.

In case of the 1982/2000/2023 rulebook, the question arises whether the land route is the fallback of the convoy route. If not, then this is just the most simple convoy paradox. The fleet in Skagerrak is dislodged and the army in Sweden will not advance.

In case fallback is possible, then the convoy is available when the land route is taken, but not otherwise.

_I prefer no fallback. That means that according to these preferences the fleet in the North Sea will dislodge the Russian fleet in Skagerrak and the army in Sweden will not advance._

#### 6.G.12. TEST CASE, SWAPPING TWO UNITS WITH TWO CONVOYS

Of course, two armies can also swap by when they are both convoyed.

England: 
A Liverpool - Edinburgh via convoy
F North Atlantic Ocean Convoys A Liverpool - Edinburgh
F Norwegian Sea Convoys A Liverpool - Edinburgh

Germany: 
A Edinburgh - Liverpool via convoy
F North Sea Convoys A Edinburgh - Liverpool
F English Channel Convoys A Edinburgh - Liverpool
F Irish Sea Convoys A Edinburgh - Liverpool

The armies in Liverpool and Edinburgh are swapped.

#### 6.G.13. TEST CASE, SUPPORT CUT ON ATTACK ON ITSELF VIA CONVOY

If a unit is attacked by a supported unit, it is not possible to prevent dislodgement by trying to cut the support. But what, if a move is attempted via a convoy?

Austria: 
F Adriatic Sea Convoys A Trieste - Venice
A Trieste - Venice via convoy

Italy: 
A Venice Supports F Albania - Trieste
F Albania - Trieste

First it should be mentioned that if for issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3) the 1971 rulebook is chosen, the move from Trieste to Venice is just a move over land (because Venice does not move in opposite direction). In that case, the support of Venice will not be cut as normal.

For the 1982/2000/2023 rulebooks the attack is via convoy and it should be decided whether the Austrian attack is considered to be coming from Trieste or from the Adriatic Sea. If it comes from Trieste, the support in Venice is not cut and the army in Trieste is dislodged by the fleet in Albania. If the Austrian attack is considered to be coming from the Adriatic Sea, then the support is cut and the army in Trieste will not be dislodged. See also issue [4.A.4](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.4).

_First of all, I prefer the 2023 rules for adjacent convoying, meaning that the move from Trieste uses the convoy. Furthermore, I think that the two Italian units are still stronger than the army in Trieste. Therefore, I prefer that the support in Venice is not cut and that the army in Trieste is dislodged by the fleet in Albania._

#### 6.G.14. TEST CASE, BOUNCE BY CONVOY TO ADJACENT PROVINCE

Similar to test case [6.G.10](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G.10), but now the other unit is taking the convoy.

England: 
A Norway - Sweden
F Denmark Supports A Norway - Sweden
F Finland Supports A Norway - Sweden

France: 
F Norwegian Sea - Norway
F North Sea Supports F Norwegian Sea - Norway

Germany: 
F Skagerrak Convoys A Sweden - Norway

Russia: 
A Sweden - Norway via convoy
F Barents Sea Supports A Sweden - Norway

Again, the army in Sweden is bounced by the fleet in the Norwegian Sea. The army in Norway will move to Sweden and dislodge the Russian army.

The final destination of the fleet in the Norwegian Sea depends on how issue [4.A.7](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.7) is resolved. If choice a is taken, then the fleet advances to Norway, but if choice b is taken (_which I prefer_) the fleet bounces and stays in the Norwegian Sea.

#### 6.G.15. TEST CASE, BOUNCE AND DISLODGE WITH DOUBLE CONVOY

Similar to test case [6.G.10](https://webdiplomacy.net/doc/DATC_v3_0.html#6.G.10), but now both units use a convoy and without some support.

England: 
F North Sea Convoys A London - Belgium
A Holland Supports A London - Belgium
A Yorkshire - London
A London - Belgium via convoy

France: 
F English Channel Convoys A Belgium - London
A Belgium - London via convoy

The French army in Belgium is bounced by the army from Yorkshire. The army in London move to Belgium, dislodging the unit there.

The final destination of the army in the Yorkshire depends on how issue [4.A.7](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.7) is resolved. If choice a is taken, then the army advances to London, but if choice b is taken (_which I prefer_) the army bounces and stays in Yorkshire.

#### 6.G.16. TEST CASE, THE TWO UNIT IN ONE AREA BUG, MOVING BY CONVOY

If the adjudicator is not correctly implemented, this may lead to a resolution where two units end up in the same area.

England: 
A Norway - Sweden
A Denmark Supports A Norway - Sweden
F Baltic Sea Supports A Norway - Sweden
F North Sea - Norway

Russia: 
A Sweden - Norway via convoy
F Skagerrak Convoys A Sweden - Norway
F Norwegian Sea Supports A Sweden - Norway

See decision details [5.B.6](https://webdiplomacy.net/doc/DATC_v3_0.html#5.B.6). If the 'PREVENT STRENGTH' is incorrectly implemented, due to the fact that it does not take into account that the 'PREVENT STRENGTH' is only zero when the unit is engaged in a head-to-head battle, then this goes wrong in this test case. The 'PREVENT STRENGTH' of Sweden would be zero, because the opposing unit in Norway successfully moves. Since, this strength would be zero, the fleet in the North Sea would move to Norway. However, although the 'PREVENT STRENGTH' is zero, the army in Sweden would also move to Norway. So, the final result would contain two units that successfully moved to Norway.

Of course, this is incorrect. Norway will indeed successfully move to Sweden while the army in Sweden ends in Norway, because it is stronger than the fleet in the North Sea. This fleet will stay in the North Sea.

#### 6.G.17. TEST CASE, THE TWO UNIT IN ONE AREA BUG, MOVING OVER LAND

Similar to the previous test case, but now the other unit moves by convoy.

England: 
A Norway - Sweden via convoy
A Denmark Supports A Norway - Sweden
F Baltic Sea Supports A Norway - Sweden
F Skagerrak Convoys A Norway - Sweden
F North Sea - Norway

Russia: 
A Sweden - Norway
F Norwegian Sea Supports A Sweden - Norway

Sweden and Norway are swapped, while the fleet in the North Sea will bounce.

#### 6.G.18. TEST CASE, THE TWO UNIT IN ONE AREA BUG, WITH DOUBLE CONVOY

Similar to the previous test case, but now both units move by convoy.

England: 
F North Sea Convoys A London - Belgium
A Holland Supports A London - Belgium
A Yorkshire - London
A London - Belgium
A Ruhr Supports A London - Belgium

France: 
F English Channel Convoys A Belgium - London
A Belgium - London
A Wales Supports A Belgium - London

Belgium and London are swapped, while the army in Yorkshire fails to move to London.

#### 6.G.19. TEST CASE, SWAPPING WITH INTENT OF UNNECESSARY CONVOY

Can the intent made clear by the order of a fleet that is not necessary?

France: 
A Marseilles - Spain
F Western Mediterranean Convoys A Marseilles - Spain

Italy:
F Gulf of Lyon Convoys A Marseilles - Spain
A Spain - Marseilles

See issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3) and [4.E.1](https://webdiplomacy.net/doc/DATC_v3_0.html#4.E.1).

In case the 1971 rules are used, the intent is not important and the units in Marseilles and Spain swap.

The point of interest is that there is a convoy route from Marseilles, Gulf of Lyon, Western Mediterranean to Spain. However, the fleet in Western Mediterranean is not necessary for this convoy and not necessary for any other convoy route. Therefore, this order should be considered illegal. Webbased adjudicators should not give this order as an option.

With the 2023 rules (_which I prefer_) illegal orders are ignored. The fleet in Gulf of Lyon is foreign and foreign units cannot express intent. With this, there is no intent to convoy and the units in Marseilles and Spain fail to move.

If explicit adjacent convoying is used (DPTG) there is also no convoy and none of the units move.

#### 6.G.20. TEST CASE, EXPLICIT CONVOY TO ADJACENT PROVINCE DISRUPTED

If a move to adjacent province was explicit via convoy, and the convoy is disrupted, should it fall back to the land route?

France: 
F Brest - English Channel
A Picardy - Belgium via Convoy
A Burgundy Supports A Picardy - Belgium
F Mid-Atlantic Ocean Supports F Brest - English Channel
 
England: 
F English Channel Convoys A Picardy - Belgium

This situation is not applicable for the 1971 and 1982 rulebooks, because they don't have the notion of 'via convoy'.

For the 2000/2023 rulebook the question arises whether the army in Picardy will fall back to the land route, since the convoy route is disrupted. See issue [4.A.3](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.3).

_I don't prefer the fallback anymore. So, the move of Picardy fails._

### 6.H. TEST CASES, RETREATING

#### 6.H.1. TEST CASE, NO SUPPORTS DURING RETREAT

Supports are not allowed in the retreat phase.

Austria: 
F Trieste Hold
A Serbia Hold

Turkey: 
F Greece Hold

Italy: 
A Venice Supports A Tyrolia - Trieste
A Tyrolia - Trieste
F Ionian Sea - Greece
F Aegean Sea Supports F Ionian Sea - Greece

The fleet in Trieste and the fleet in Greece are dislodged. If the retreat orders are as follows:

Austria: 
F Trieste - Albania
A Serbia Supports F Trieste - Albania

Turkey: 
F Greece - Albania

The Austrian support order is illegal. Both dislodged fleets are disbanded.

#### 6.H.2. TEST CASE, NO SUPPORTS FROM RETREATING UNIT

Even a retreating unit cannot give support.

England: 
A Liverpool - Edinburgh
F Yorkshire Supports A Liverpool - Edinburgh
F Norway Hold

Germany: 
A Kiel Supports A Ruhr - Holland
A Ruhr - Holland

Russia: 
F Edinburgh Hold
A Sweden Supports A Finland - Norway
A Finland - Norway
F Holland Hold

The English fleet in Norway and the Russian fleets in Edinburgh and Holland are dislodged. If the following retreat orders are given:

England:
F Norway - North Sea

Russia:
F Edinburgh - North Sea
F Holland Supports F Edinburgh - North Sea

Although the fleet in Holland may receive an order, it may not support (it is disbanded). The English fleet in Norway and the Russian fleet in Edinburgh bounce and are disbanded.

#### 6.H.3. TEST CASE, NO CONVOY DURING RETREAT

Convoys during retreat are not allowed.

England: 
F North Sea Hold
A Holland Hold

Germany: 
F Kiel Supports A Ruhr - Holland
A Ruhr - Holland

The English army in Holland is dislodged. If England orders the following in retreat:

England: 
A Holland - Yorkshire
F North Sea Convoys A Holland - Yorkshire

The convoy order is illegal. The army in Holland is disbanded.

#### 6.H.4. TEST CASE, NO OTHER MOVES DURING RETREAT

Of course, you may not do any other move during a retreat. But look if the adjudicator checks for it.

England: 
F North Sea Hold
A Holland Hold

Germany: 
F Kiel Supports A Ruhr - Holland
A Ruhr - Holland

The English army in Holland is dislodged. If England orders the following in retreat:

England: 
A Holland - Belgium
F North Sea - Norwegian Sea

The fleet in the North Sea is not dislodge, so the move is illegal.

#### 6.H.5. TEST CASE, A UNIT MAY NOT RETREAT TO THE AREA FROM WHICH IT IS ATTACKED

Well, that would be of course stupid. Still, the adjudicator must be tested on this.

Russia: 
F Constantinople Supports F Black Sea - Ankara
F Black Sea - Ankara

Turkey: 
F Ankara Hold

Fleet in Ankara is dislodged and may not retreat to Black Sea.

#### 6.H.6. TEST CASE, UNIT MAY NOT RETREAT TO A CONTESTED AREA

Standoff prevents retreat to the area.

Austria: 
A Budapest Supports A Trieste - Vienna
A Trieste - Vienna

Germany: 
A Munich - Bohemia
A Silesia - Bohemia

Italy: 
A Vienna Hold

The Italian army in Vienna is dislodged. It may not retreat to Bohemia.

#### 6.H.7. TEST CASE, MULTIPLE RETREAT TO SAME AREA WILL DISBAND UNITS

There can only be one unit in an area.

Austria: 
A Budapest Supports A Trieste - Vienna
A Trieste - Vienna

Germany: 
A Munich Supports A Silesia - Bohemia
A Silesia - Bohemia

Italy: 
A Vienna Hold
A Bohemia Hold

If Italy orders the following for retreat:

Italy: 
A Bohemia - Tyrolia
A Vienna - Tyrolia

Both armies will be disbanded.

#### 6.H.8. TEST CASE, TRIPLE RETREAT TO SAME AREA WILL DISBAND UNITS

When three units retreat to the same area, then all three units are disbanded.

England: 
A Liverpool - Edinburgh
F Yorkshire Supports A Liverpool - Edinburgh
F Norway Hold

Germany: 
A Kiel Supports A Ruhr - Holland
A Ruhr - Holland

Russia: 
F Edinburgh Hold
A Sweden Supports A Finland - Norway
A Finland - Norway
F Holland Hold

The fleets in Norway, Edinburgh and Holland are dislodged. If the following retreat orders are given:

England: 
F Norway - North Sea

Russia: 
F Edinburgh - North Sea
F Holland - North Sea

All three units are disbanded.

#### 6.H.9. TEST CASE, DISLODGED UNIT WILL NOT MAKE ATTACKERS AREA CONTESTED

An army can follow.

England: 
F Helgoland Bight - Kiel
F Denmark Supports F Helgoland Bight - Kiel

Germany: 
A Berlin - Prussia
F Kiel Hold
A Silesia Supports A Berlin - Prussia

Russia: 
A Prussia - Berlin

The fleet in Kiel can retreat to Berlin.

#### 6.H.10. TEST CASE, NOT RETREATING TO ATTACKER DOES NOT MEAN CONTESTED

An army cannot retreat to the area of the attacker. The easiest way to program that, is to mark that area as "contested". However, this is not correct. Another army may retreat to that area.

England: 
A Kiel Hold

Germany: 
A Berlin - Kiel
A Munich Supports A Berlin - Kiel
A Prussia Hold

Russia: 
A Warsaw - Prussia
A Silesia Supports A Warsaw - Prussia

The armies in Kiel and Prussia are dislodged. The English army in Kiel cannot retreat to Berlin, but the army in Prussia can retreat to Berlin. Suppose the following retreat orders are given:

England:
A Kiel - Berlin

Germany:
A Prussia - Berlin

The English retreat to Berlin is illegal and fails (the unit is disbanded). The German retreat to Berlin is successful and does not bounce on the English unit.

#### 6.H.11. TEST CASE, RETREAT WHEN DISLODGED BY ADJACENT CONVOY

If a unit is dislodged by an army via convoy, the question arises whether the dislodged army can retreat to the original province of the convoyed army. This is only relevant in case the convoy was to an adjacent province.

France: 
A Gascony - Marseilles via convoy
A Burgundy Supports A Gascony - Marseilles
F Mid-Atlantic Ocean Convoys A Gascony - Marseilles
F Western Mediterranean Convoys A Gascony - Marseilles
F Gulf of Lyon Convoys A Gascony - Marseilles

Italy: 
A Marseilles Hold

The army in Gascony takes a convoy and does not pass the border of Gascony with Marseilles (it went a completely different direction). Now, the result depends on which rule is used for retreating (see issue [4.A.5](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.5)).

_The 2023 rules explicitly allow this. So, I prefer that Marseilles may retreat to Gascony._

#### 6.H.12. TEST CASE, RETREAT WHEN DISLODGED BY ADJACENT CONVOY WHILE TRYING TO DO THE SAME

The previous test case can be made more extra ordinary, when both armies tried to move by convoy.

England: 
A Liverpool - Edinburgh via convoy
F Irish Sea Convoys A Liverpool - Edinburgh
F English Channel Convoys A Liverpool - Edinburgh
F North Sea Convoys A Liverpool - Edinburgh

France: 
F Brest - English Channel
F Mid-Atlantic Ocean Supports F Brest - English Channel

Russia: 
A Edinburgh - Liverpool via convoy
F Norwegian Sea Convoys A Edinburgh - Liverpool
F North Atlantic Ocean Convoys A Edinburgh - Liverpool
A Clyde Supports A Edinburgh - Liverpool

Both the army in Liverpool as in Edinburgh will try to move by convoy. The army in Edinburgh will succeed. The army in Liverpool will fail, because of the disrupted convoy. It is dislodged by the army of Edinburgh. Now, the question is whether the army in Liverpool may retreat to Edinburgh. The result depends on which rule is used for retreating (see issue [4.A.5](https://webdiplomacy.net/doc/DATC_v3_0.html#4.A.5)).

_The 2023 rules, which I prefer, explicitly allow that the army in Liverpool may retreat to Edinburgh._

#### 6.H.13. TEST CASE, NO RETREAT WITH CONVOY IN MOVEMENT PHASE

The areas where a unit may retreat to, must be determined during the movement phase. Care should be taken that a convoy ordered in the movement phase cannot be used in the retreat phase.

England: 
A Picardy Hold
F English Channel Convoys A Picardy - London

France: 
A Paris - Picardy
A Brest Supports A Paris - Picardy

The dislodged army in Picardy cannot retreat to London.

#### 6.H.14. TEST CASE, NO RETREAT WITH SUPPORT IN MOVEMENT PHASE

Comparable to the previous test case, a support given in the movement phase cannot be used in the retreat phase.

England: 
A Picardy Hold
F English Channel Supports A Picardy - Belgium

France: 
A Paris - Picardy
A Brest Supports A Paris - Picardy
A Burgundy Hold

Germany: 
A Munich Supports A Marseilles - Burgundy
A Marseilles - Burgundy

After the movement phase the following retreat orders are given:

England: 
A Picardy - Belgium

France: 
A Burgundy - Belgium

Both the army in Picardy and Burgundy are disbanded.

#### 6.H.15. TEST CASE, NO COASTAL CRAWL IN RETREAT

You cannot go to the other coast from where the attacker came from.

England: 
F Portugal Hold

France: 
F Spain(sc) - Portugal
F Mid-Atlantic Ocean Supports F Spain(sc) - Portugal

The English fleet in Portugal is destroyed and cannot retreat to Spain(nc).

#### 6.H.16. TEST CASE, CONTESTED FOR BOTH COASTS

If a coast is contested, the other is not available for retreat.

France: 
F Mid-Atlantic Ocean - Spain(nc)
F Gascony - Spain(nc)
F Western Mediterranean Hold

Italy: 
F Tunis Supports F Tyrrhenian Sea - Western Mediterranean
F Tyrrhenian Sea - Western Mediterranean

The French fleet in the Western Mediterranean cannot retreat to Spain(sc).

### 6.I. TEST CASES, BUILDING

#### 6.I.1. TEST CASE, TOO MANY BUILD ORDERS

Check how program reacts when someone orders too many builds.

Germany may build one:

Germany:
Build A Warsaw
Build A Kiel
Build A Munich

Program should not build all three, but handle it in another way. See issue [4.D.4](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.4).

_I prefer that the build orders are just handled one by one until all allowed units are build. According to this preference, the build in Warsaw fails, the build in Kiel succeeds and the build in Munich fails._

#### 6.I.2. TEST CASE, FLEETS CANNOT BE BUILD IN LAND AREAS

Physical this is possible, but it is still not allowed.

Russia has one build and Moscow is empty.

Russia:
Build F Moscow

See issue [4.C.4](https://webdiplomacy.net/doc/DATC_v3_0.html#4.C.4). Some game masters will change the order and build an army in Moscow.

_I prefer that the build fails._

#### 6.I.3. TEST CASE, SUPPLY CENTER MUST BE EMPTY FOR BUILDING

You can't have two units in a sector. So, you can't build when there is a unit in the supply center.

Germany may build a unit but has an army in Berlin. Germany orders the following:

Germany:
Build A Berlin

Build fails.

#### 6.I.4. TEST CASE, BOTH COASTS MUST BE EMPTY FOR BUILDING

If a sector is occupied on one coast, the other coast cannot be used for building.

Russia may build a unit and has a fleet in St Petersburg(sc). Russia orders the following:

Russia:
Build A St Petersburg(nc)

Build fails.

#### 6.I.5. TEST CASE, BUILDING IN HOME SUPPLY CENTER THAT IS NOT OWNED

Building a unit is only allowed when supply center is a home supply center and is owned. If not owned, build fails.

Russia captured Berlin in Fall, but left in the next year. Germany captured other supply centers, but without recapturing Berling it may not build in Berlin.

Germany:
Build A Berlin

Build fails.

#### 6.I.6. TEST CASE, BUILDING IN OWNED SUPPLY CENTER THAT IS NOT A HOME SUPPLY CENTER

Building a unit is only allowed when supply center is a home supply center and is owned. If it is not a home supply center, the build fails.

Germany owns Warsaw, Warsaw is empty and Germany may build one unit.

Germany:
Build A Warsaw

Build fails.

#### 6.I.7. TEST CASE, ONLY ONE BUILD IN A HOME SUPPLY CENTER

If you may build two units, you can still only build one in a supply center.

Russia owns Moscow, Moscow is empty and Russia may build two units.

Russia:
Build A Moscow
Build A Moscow

The second build should fail.

### 6.J. TEST CASES, CIVIL DISORDER AND DISBANDS

#### 6.J.1. TEST CASE, TOO MANY DISBAND ORDERS

Check how program reacts when someone orders too many disbands.

France has to disband one and has an army in Paris and Picardy.

France:
Remove F Gulf of Lyon
Remove A Picardy
Remove A Paris

Program should not disband both Paris and Picardy, but should handle it in a different way. See also issue [4.D.6](https://webdiplomacy.net/doc/DATC_v3_0.html#4.D.6).

_I prefer that the disband orders are handled one by one. According to the preference, the removal of the fleet in the Gulf of Lyon fails (no fleet), the removal of the army in Picardy succeeds and the removal of the army in Paris fails (too many disbands)._

#### 6.J.2. TEST CASE, REMOVING THE SAME UNIT TWICE

If you have to remove two units, you can always try to trick the computer by removing the same unit twice.

France has to disband two and has an army in Paris.

France:
Remove A Paris
Remove A Paris

Program should remove army in Paris and remove another unit by using the civil disorder rules.

#### 6.J.3. TEST CASE, CIVIL DISORDER TWO ARMIES WITH DIFFERENT DISTANCE

When a player forgets to disband a unit, the civil disorder rules must be applied. When two armies have different distance from the home supply centers, then the army with the greatest distance has to be removed.

Russia has to remove one.
Russia owns supply center St Petersburg.
Russia has armies in Livonia and Sweden.
Russia does not order a disband.

The army in Sweden is removed.

#### 6.J.4. TEST CASE, CIVIL DISORDER TWO ARMIES WITH EQUAL DISTANCE

If two armies have equal distance from the home supply centers, then alphabetical order is used.

Russia has to remove one.
Russia owns Moscow.
Russia has armies in Livonia and Ukraine.
Russia does not order a disband.

Both armies have distance one. The Livonia army is removed, because it appears first in alphabetical order.

#### 6.J.5 TEST CASE, CIVIL DISORDER TWO FLEETS WITH DIFFERENT DISTANCE

If two fleets have different distance from the home supply centers, then the fleet with the greatest distance has to be removed. Note that fleets cannot go over land.

Russia has to remove one.
Russia owns St Petersburg.
Russia has fleets in Skagerrak and Berlin.
Russia does not order a disband.

The distance of the fleet in Berlin is three, the fleet in Skagerrak has distance two (via Norway). So, the fleet in Berlin has to be removed.

#### 6.J.6. TEST CASE, CIVIL DISORDER TWO FLEETS WITH EQUAL DISTANCE

Alphabetical order is used, when two fleets have equal distance to the home supply centers.

Russia has to remove one.
Russia owns Munich.
Russia has fleets in Gulf of Bothnia and North Sea.
Russia does not order a disband.

Note, that in 2023 rules distance is calculated to owned supply centers (instead of home supply centers). Also, for distance calculations both armies and fleets can take both land and sea. Both distances are three. The fleet in Gulf of Bothnia is removed, because it appears first in alphabetical order.

#### 6.J.7. TEST CASE, CIVIL DISORDER TWO FLEETS AND ARMY WITH EQUAL DISTANCE

In removal, the fleet has precedence over an army. In this case there are two fleets, to make the test more complex.

Russia has to remove one.
Russia owns St Petersburg and Warsaw.
Russia has an army in Bohemia, a fleet in Skagerrak and a fleet in the North Sea.
Russia does not order a disband.

The distances of the army and the fleets to one of the owned supply centers are two. The fleets take precedence above the army (although the army is alphabetical first). The fleet in the North Sea is alphabetical first, compared to Skagerrak and has to be removed.

#### 6.J.8. TEST CASE, CIVIL DISORDER A FLEET WITH SHORTER DISTANCE THEN THE ARMY

If the fleet has a shorter distance than the army, the army is removed.

Russia has to remove one.
Russia has an army in Tyrolia and a fleet in the Baltic Sea.
Russia owns Warsaw.
Russia does not order a disband.

The distance of the army to Warsaw is three while the distance of the fleet is two. So, the army is removed.

#### 6.J.9. TEST CASE, CIVIL DISORDER MUST BE COUNTED FROM BOTH COASTS

Distance must be calculated from both coasts.

Russia has to remove one.
Russia owns St Petersburg and Sevastopol.
Russia has armies in Greece and Sevastopol and a fleet in the Baltic Sea.
Russia does not order a disband.

The distance of the fleet to St Petersburg(nc) is three but to St Petersburg(sc) is two. So, the army in Greece must be removed.

Russia has to remove one.
Russia owns St Petersburg and Sevastopol.
Russia has armies in Greece and Sevastopol and a fleet in Skagerrak.
Russia does not order a disband.

The distance of the fleet to St Petersburg(sc) is three but to St Petersburg(nc) is two. So, the army in Greece must be removed.

#### 6.J.10. TEST CASE, CIVIL DISORDER COUNTING CONVOYING DISTANCE

For calculating the distance for armies all areas must be considered.

Italy has to remove one.
Italy owns Naples.
Italy has armies in Greece and Piedmont.
Italy does not order a disband.

The distance from Greece to owned supply center is five over land. However, for distance calculation it can go over water and arrive in two steps. The army in Piedmont has to be removed.

#### 6.J.11. TEST CASE, DISTANCE TO OWNED SUPPLY CENTER

The 2023 rules say that distance must be calculated to owned supply center instead of home supply center (as it was in the older rulebooks).

Italy has to remove one.
Italy owns Warsaw.
Italy has armies in Warsaw and Tuscany.
Italy does not order a disband.

The army in Tuscany is removed and Italy will continue defending its supply center in Warsaw. Under older rulebooks the army in Tuscany was kept.

(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'9dbd12c54aabf54f',t:'MTc3MzQyNjI0Mw=='};var a=document.createElement('script');a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')\[0\].appendChild(a);";b.getElementsByTagName('head')\[0\].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
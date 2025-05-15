# Team Colors Database

This document provides the color codes for teams across major sports leagues. These colors will be used for the "Bet Now" button theming for premium subscribers.

## Database Structure

```typescript
interface TeamColor {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  neonPrimaryColor: string;
  neonSecondaryColor: string;
}

interface TeamColorsDatabase {
  nba: Record<string, TeamColor>;
  nfl: Record<string, TeamColor>;
  mlb: Record<string, TeamColor>;
  nhl: Record<string, TeamColor>;
  wnba: Record<string, TeamColor>;
  ncaab: Record<string, TeamColor>;
}
```

## NBA Teams

| Team ID | Name | Primary Color | Secondary Color | Neon Primary | Neon Secondary |
|---------|------|---------------|-----------------|--------------|----------------|
| lakers | Los Angeles Lakers | #552583 | #FDB927 | #7747A3 | #FFDB8C |
| warriors | Golden State Warriors | #1D428A | #FFC72C | #3D62AA | #FFD74C |
| celtics | Boston Celtics | #007A33 | #BA9653 | #20AA53 | #DAB673 |
| nets | Brooklyn Nets | #000000 | #FFFFFF | #404040 | #FFFFFF |
| knicks | New York Knicks | #006BB6 | #F58426 | #208BD6 | #FFA446 |
| sixers | Philadelphia 76ers | #006BB6 | #ED174C | #208BD6 | #FF376C |
| raptors | Toronto Raptors | #CE1141 | #000000 | #EE3161 | #404040 |
| bulls | Chicago Bulls | #CE1141 | #000000 | #EE3161 | #404040 |
| cavaliers | Cleveland Cavaliers | #860038 | #FDBB30 | #A62058 | #FFDB50 |
| pistons | Detroit Pistons | #C8102E | #1D42BA | #E8304E | #3D62DA |
| pacers | Indiana Pacers | #002D62 | #FDBB30 | #204D82 | #FFDB50 |
| bucks | Milwaukee Bucks | #00471B | #EEE1C6 | #20673B | #FFF1E6 |
| hawks | Atlanta Hawks | #E03A3E | #C1D32F | #FF5A5E | #E1F34F |
| hornets | Charlotte Hornets | #1D1160 | #00788C | #3D3180 | #20A8AC |
| heat | Miami Heat | #98002E | #F9A01B | #B8204E | #FFBF3B |
| magic | Orlando Magic | #0077C0 | #C4CED4 | #2097E0 | #E4EEF4 |
| wizards | Washington Wizards | #002B5C | #E31837 | #204B7C | #FF3857 |
| nuggets | Denver Nuggets | #0E2240 | #FEC524 | #2E4260 | #FFE544 |
| timberwolves | Minnesota Timberwolves | #0C2340 | #236192 | #2C4360 | #4381B2 |
| thunder | Oklahoma City Thunder | #007AC1 | #EF3B24 | #209AE1 | #FF5B44 |
| blazers | Portland Trail Blazers | #E03A3E | #000000 | #FF5A5E | #404040 |
| jazz | Utah Jazz | #002B5C | #00471B | #204B7C | #20673B |
| mavericks | Dallas Mavericks | #00538C | #B8C4CA | #2073AC | #D8E4EA |
| rockets | Houston Rockets | #CE1141 | #000000 | #EE3161 | #404040 |
| grizzlies | Memphis Grizzlies | #5D76A9 | #12173F | #7D96C9 | #32375F |
| pelicans | New Orleans Pelicans | #0C2340 | #C8102E | #2C4360 | #E8304E |
| spurs | San Antonio Spurs | #C4CED4 | #000000 | #E4EEF4 | #404040 |
| suns | Phoenix Suns | #1D1160 | #E56020 | #3D3180 | #FF8040 |
| kings | Sacramento Kings | #5A2D81 | #63727A | #7A4DA1 | #83929A |
| clippers | Los Angeles Clippers | #C8102E | #1D428A | #E8304E | #3D62AA |

## NFL Teams

| Team ID | Name | Primary Color | Secondary Color | Neon Primary | Neon Secondary |
|---------|------|---------------|-----------------|--------------|----------------|
| cardinals | Arizona Cardinals | #97233F | #000000 | #B7435F | #404040 |
| falcons | Atlanta Falcons | #A71930 | #000000 | #C73950 | #404040 |
| ravens | Baltimore Ravens | #241773 | #000000 | #443793 | #404040 |
| bills | Buffalo Bills | #00338D | #C60C30 | #2053AD | #E62C50 |
| panthers | Carolina Panthers | #0085CA | #101820 | #20A5EA | #303840 |
| bears | Chicago Bears | #0B162A | #C83803 | #2B3648 | #E85823 |
| bengals | Cincinnati Bengals | #FB4F14 | #000000 | #FF6F34 | #404040 |
| browns | Cleveland Browns | #311D00 | #FF3C00 | #513D20 | #FF5C20 |
| cowboys | Dallas Cowboys | #003594 | #041E42 | #2055B4 | #243E62 |
| broncos | Denver Broncos | #FB4F14 | #002244 | #FF6F34 | #204264 |
| lions | Detroit Lions | #0076B6 | #B0B7BC | #2096D6 | #D0D7DC |
| packers | Green Bay Packers | #203731 | #FFB612 | #405751 | #FFD632 |
| texans | Houston Texans | #03202F | #A71930 | #234050 | #C73950 |
| colts | Indianapolis Colts | #002C5F | #A2AAAD | #204C7F | #C2CACD |
| jaguars | Jacksonville Jaguars | #101820 | #D7A22A | #303840 | #F7C24A |
| chiefs | Kansas City Chiefs | #E31837 | #FFB81C | #FF3857 | #FFD83C |
| raiders | Las Vegas Raiders | #000000 | #A5ACAF | #404040 | #C5CCCF |
| chargers | Los Angeles Chargers | #0080C6 | #FFC20E | #20A0E6 | #FFE22E |
| rams | Los Angeles Rams | #003594 | #FFA300 | #2055B4 | #FFC320 |
| dolphins | Miami Dolphins | #008E97 | #FC4C02 | #20AEB7 | #FF6C22 |
| vikings | Minnesota Vikings | #4F2683 | #FFC62F | #6F46A3 | #FFE64F |
| patriots | New England Patriots | #002244 | #C60C30 | #204264 | #E62C50 |
| saints | New Orleans Saints | #D3BC8D | #101820 | #F3DCAD | #303840 |
| giants | New York Giants | #0B2265 | #A71930 | #2B4285 | #C73950 |
| jets | New York Jets | #125740 | #000000 | #327760 | #404040 |
| eagles | Philadelphia Eagles | #004C54 | #A5ACAF | #206C74 | #C5CCCF |
| steelers | Pittsburgh Steelers | #FFB612 | #101820 | #FFD632 | #303840 |
| fortyniners | San Francisco 49ers | #AA0000 | #B3995D | #CA2020 | #D3B97D |
| seahawks | Seattle Seahawks | #002244 | #69BE28 | #204264 | #89DE48 |
| buccaneers | Tampa Bay Buccaneers | #D50A0A | #FF7900 | #F52A2A | #FF9920 |
| titans | Tennessee Titans | #0C2340 | #4B92DB | #2C4360 | #6BB2FB |
| commanders | Washington Commanders | #5A1414 | #FFB612 | #7A3434 | #FFD632 |

## MLB Teams

| Team ID | Name | Primary Color | Secondary Color | Neon Primary | Neon Secondary |
|---------|------|---------------|-----------------|--------------|----------------|
| diamondbacks | Arizona Diamondbacks | #A71930 | #E3D4AD | #C73950 | #F3E4CD |
| braves | Atlanta Braves | #CE1141 | #13274F | #EE3161 | #33476F |
| orioles | Baltimore Orioles | #DF4601 | #000000 | #FF6621 | #404040 |
| redsox | Boston Red Sox | #BD3039 | #0C2340 | #DD5059 | #2C4360 |
| cubs | Chicago Cubs | #0E3386 | #CC3433 | #2E53A6 | #EC5453 |
| whitesox | Chicago White Sox | #27251F | #C4CED4 | #47453F | #E4EEF4 |
| reds | Cincinnati Reds | #C6011F | #000000 | #E6213F | #404040 |
| guardians | Cleveland Guardians | #00385D | #E31937 | #20587D | #FF3957 |
| rockies | Colorado Rockies | #33006F | #C4CED4 | #53208F | #E4EEF4 |
| tigers | Detroit Tigers | #0C2340 | #FA4616 | #2C4360 | #FF6636 |
| astros | Houston Astros | #002D62 | #EB6E1F | #204D82 | #FF8E3F |
| royals | Kansas City Royals | #004687 | #BD9B60 | #206687 | #DDB980 |
| angels | Los Angeles Angels | #BA0021 | #003263 | #DA2041 | #205283 |
| dodgers | Los Angeles Dodgers | #005A9C | #A5ACAF | #207ABC | #C5CCCF |
| marlins | Miami Marlins | #00A3E0 | #EF3340 | #20C3FF | #FF5360 |
| brewers | Milwaukee Brewers | #0A2351 | #FFC52F | #2A4371 | #FFE54F |
| twins | Minnesota Twins | #002B5C | #D31145 | #204B7C | #F33165 |
| mets | New York Mets | #002D72 | #FF5910 | #204D92 | #FF7930 |
| yankees | New York Yankees | #0C2340 | #FFFFFF | #2C4360 | #FFFFFF |
| athletics | Oakland Athletics | #003831 | #EFB21E | #20583E | #FFD23E |
| phillies | Philadelphia Phillies | #E81828 | #002D72 | #FF3848 | #204D92 |
| pirates | Pittsburgh Pirates | #27251F | #FDB827 | #47453F | #FFD847 |
| padres | San Diego Padres | #2F241D | #FFC425 | #4F443D | #FFE445 |
| giants | San Francisco Giants | #FD5A1E | #27251F | #FF7A3E | #47453F |
| mariners | Seattle Mariners | #0C2C56 | #005C5C | #2C4C76 | #207C7C |
| cardinals | St. Louis Cardinals | #C41E3A | #0C2340 | #E43E5A | #2C4360 |
| rays | Tampa Bay Rays | #092C5C | #8FBCE6 | #294C7C | #AFDCFF |
| rangers | Texas Rangers | #003278 | #C0111F | #205298 | #E0313F |
| bluejays | Toronto Blue Jays | #134A8E | #1D2D5C | #336AAE | #3D4D7C |
| nationals | Washington Nationals | #AB0003 | #14225A | #CB2023 | #34427A |

## NHL Teams

| Team ID | Name | Primary Color | Secondary Color | Neon Primary | Neon Secondary |
|---------|------|---------------|-----------------|--------------|----------------|
| ducks | Anaheim Ducks | #F47A38 | #B9975B | #FF9A58 | #D9B77B |
| coyotes | Arizona Coyotes | #8C2633 | #E2D6B5 | #AC4653 | #F2E6D5 |
| bruins | Boston Bruins | #FFB81C | #000000 | #FFD83C | #404040 |
| sabres | Buffalo Sabres | #002654 | #FCB514 | #204674 | #FFD534 |
| flames | Calgary Flames | #C8102E | #F1BE48 | #E8304E | #FFD868 |
| hurricanes | Carolina Hurricanes | #CC0000 | #000000 | #EC2020 | #404040 |
| blackhawks | Chicago Blackhawks | #CF0A2C | #000000 | #EF2A4C | #404040 |
| avalanche | Colorado Avalanche | #6F263D | #236192 | #8F465D | #4381B2 |
| bluejackets | Columbus Blue Jackets | #002654 | #CE1126 | #204674 | #EE3146 |
| stars | Dallas Stars | #006847 | #8F8F8C | #208867 | #AFAFAC |
| redwings | Detroit Red Wings | #CE1126 | #FFFFFF | #EE3146 | #FFFFFF |
| oilers | Edmonton Oilers | #041E42 | #FF4C00 | #243E62 | #FF6C20 |
| panthers | Florida Panthers | #041E42 | #C8102E | #243E62 | #E8304E |
| kings | Los Angeles Kings | #111111 | #A2AAAD | #313131 | #C2CACD |
| wild | Minnesota Wild | #154734 | #A6192E | #356754 | #C6394E |
| canadiens | Montreal Canadiens | #AF1E2D | #192168 | #CF3E4D | #393888 |
| predators | Nashville Predators | #FFB81C | #041E42 | #FFD83C | #243E62 |
| devils | New Jersey Devils | #CE1126 | #000000 | #EE3146 | #404040 |
| islanders | New York Islanders | #00539B | #F47D30 | #2073BB | #FF9D50 |
| rangers | New York Rangers | #0038A8 | #CE1126 | #2058C8 | #EE3146 |
| senators | Ottawa Senators | #C52032 | #000000 | #E54052 | #404040 |
| flyers | Philadelphia Flyers | #F74902 | #000000 | #FF6922 | #404040 |
| penguins | Pittsburgh Penguins | #000000 | #FCB514 | #404040 | #FFD534 |
| sharks | San Jose Sharks | #006D75 | #000000 | #208D95 | #404040 |
| kraken | Seattle Kraken | #001628 | #99D9D9 | #203648 | #B9F9F9 |
| blues | St. Louis Blues | #002F87 | #FCB514 | #204FA7 | #FFD534 |
| lightning | Tampa Bay Lightning | #002868 | #FFFFFF | #204888 | #FFFFFF |
| mapleleafs | Toronto Maple Leafs | #00205B | #FFFFFF | #20407B | #FFFFFF |
| canucks | Vancouver Canucks | #00205B | #00843D | #20407B | #20A45D |
| goldenknights | Vegas Golden Knights | #B4975A | #333F42 | #D4B77A | #535F62 |
| capitals | Washington Capitals | #041E42 | #C8102E | #243E62 | #E8304E |
| jets | Winnipeg Jets | #041E42 | #004C97 | #243E62 | #206CB7 |

## WNBA Teams

| Team ID | Name | Primary Color | Secondary Color | Neon Primary | Neon Secondary |
|---------|------|---------------|-----------------|--------------|----------------|
| dream | Atlanta Dream | #C4D600 | #0085CA | #E4F620 | #20A5EA |
| sky | Chicago Sky | #418FDE | #FFCD00 | #61AFFE | #FFED20 |
| wings | Dallas Wings | #0C2340 | #BEC0C2 | #2C4360 | #DEE0E2 |
| fever | Indiana Fever | #FFCD00 | #0C2340 | #FFED20 | #2C4360 |
| sparks | Los Angeles Sparks | #702F8A | #FFC72C | #904FAA | #FFE74C |
| lynx | Minnesota Lynx | #0C2340 | #236192 | #2C4360 | #4381B2 |
| liberty | New York Liberty | #6ECEB2 | #000000 | #8EEED2 | #404040 |
| mercury | Phoenix Mercury | #201747 | #FF6B01 | #403767 | #FF8B21 |
| aces | Las Vegas Aces | #000000 | #A9A9A9 | #404040 | #C9C9C9 |
| storm | Seattle Storm | #2C5234 | #FFC200 | #4C7254 | #FFE220 |
| mystics | Washington Mystics | #C4D600 | #0C2340 | #E4F620 | #2C4360 |
| sun | Connecticut Sun | #DE6110 | #41B6E6 | #FE8130 | #61D6FF |

## NCAA Basketball Teams (Top 25)

| Team ID | Name | Primary Color | Secondary Color | Neon Primary | Neon Secondary |
|---------|------|---------------|-----------------|--------------|----------------|
| gonzaga | Gonzaga Bulldogs | #041E42 | #C8102E | #243E62 | #E8304E |
| baylor | Baylor Bears | #003015 | #FFDD00 | #205035 | #FFFD20 |
| kansas | Kansas Jayhawks | #0051BA | #E8000D | #2071DA | #FF202D |
| villanova | Villanova Wildcats | #00205B | #13B5EA | #20407B | #33D5FF |
| arizona | Arizona Wildcats | #CC0033 | #003366 | #EC2053 | #205386 |
| duke | Duke Blue Devils | #001A57 | #FFFFFF | #203A77 | #FFFFFF |
| kentucky | Kentucky Wildcats | #0033A0 | #FFFFFF | #2053C0 | #FFFFFF |
| purdue | Purdue Boilermakers | #CEB888 | #000000 | #EED8A8 | #404040 |
| auburn | Auburn Tigers | #0C2340 | #E87722 | #2C4360 | #FF9742 |
| tennessee | Tennessee Volunteers | #FF8200 | #FFFFFF | #FFA220 | #FFFFFF |
| illinois | Illinois Fighting Illini | #13294B | #E84A27 | #334968 | #FF6A47 |
| ucla | UCLA Bruins | #2D68C4 | #F2A900 | #4D88E4 | #FFC920 |
| texastech | Texas Tech Red Raiders | #CC0000 | #000000 | #EC2020 | #404040 |
| wisconsin | Wisconsin Badgers | #C5050C | #FFFFFF | #E5252C | #FFFFFF |
| houston | Houston Cougars | #C8102E | #76232F | #E8304E | #96434F |
| arkansas | Arkansas Razorbacks | #9D2235 | #FFFFFF | #BD4255 | #FFFFFF |
| providence | Providence Friars | #000000 | #C4CED4 | #404040 | #E4EEF4 |
| connecticut | Connecticut Huskies | #0C2340 | #FFFFFF | #2C4360 | #FFFFFF |
| northcarolina | North Carolina Tar Heels | #7BAFD4 | #FFFFFF | #9BCFF4 | #FFFFFF |
| saintmarys | Saint Mary's Gaels | #06315B | #D80024 | #26537B | #F82044 |
| murray | Murray State Racers | #002144 | #ECAC00 | #204164 | #FFCC20 |
| loyolachicago | Loyola Chicago Ramblers | #800000 | #FFCC00 | #A02020 | #FFEC20 |
| ohiostate | Ohio State Buckeyes | #BB0000 | #666666 | #DB2020 | #868686 |
| texasam | Texas A&M Aggies | #500000 | #FFFFFF | #702020 | #FFFFFF |
| michigan | Michigan Wolverines | #00274C | #FFCB05 | #20476C | #FFEB25 |
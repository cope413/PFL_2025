# key = incorrect spelling of player name
# value = correct spelling of player name

names_to_fix = {
    'Devon Achane': "De'Von Achane",
    'DJ Chark Jr.': 'DJ Chark',
    'Gabe Davis': 'Gabriel Davis',
    'Evan Mcpherson': 'Evan McPherson',
    'Kavontae Turpin': 'KaVontae Turpin',
    'Jaleel Mclaughlin': 'Jaleel McLaughlin',
    'Sam Laporta': 'Sam LaPorta',
    "Ka'Imi Fairbairn": "Ka'imi Fairbairn",
    'Brandon Mcmanus': 'Brandon McManus',
    'Christian Mccaffrey': 'Christian McCaffrey',
    'Deforest Buckner': 'DeForest Buckner',
    'deforest buckner': 'DeForest Buckner',
    'daron bland': 'DaRon Bland',
    'Daron Bland': 'DaRon Bland',
    'Devonta Smith': 'DeVonta Smith',
    'Chase Mclaughlin': 'Chase McLaughlin',
    # 'Kenneth Walker Iii': 'Kenneth Walker III',
    'Terry Mclaurin': 'Terry McLaurin',
    'terry mclaurin': 'Terry McLaurin',
    'Marvin Mims Jr.': 'Marvin Mims',
    'Tank Dell': 'Nathaniel Dell',
    'Aj Epenesa': 'AJ Epenesa',
    'Jerick Mckinnon': 'Jerick McKinnon',
    'Robbie Anderson': 'Robbie Chosen',
    # 'Calvin Austin Iii': 'Calvin Austin III',
    'Ceedee Lamb': 'CeeDee Lamb',
    'Drew Ogletree': 'Andrew Ogletree',
    'MO Alie-Cox': 'Mo Alie-Cox',
    'Tony Fields Ii': 'Tony Fields II',
    'Jaxon Smithnjigba': 'Jaxon SmithNjigba',
    'Jaxon Smith-Njigba': 'Jaxon SmithNjigba',
    'Deandre Hopkins': 'DeAndre Hopkins',
    'Trey Mcbride': 'Trey McBride',
    'TY Chandler': 'Ty Chandler',
    'Deejay Dallas': 'DeeJay Dallas',
    'Ladd Mcconkey': 'Ladd McConkey',
    'BO Nix': 'Bo Nix',
    "Chig Okonkwo": "Chigoziem Okonkwo",
    "Jalen Mcmillan": "Jalen McMillan",
    "Deebo Samuel": "Deebo Samuel Sr.",
    "Deebo Samuel Sr. Sr.": "Deebo Samuel Sr.",
    "Rodney Mcleod Jr.": "Rodney McLeod",
    "Khadarel Hodge": "KhaDarel Hodge",
    "Jaylen Mccollough": "Jaylen McCollough",
    "Bryce Ford-Wheaton": "Bryce FordWheaton",
    "Demarvion Overshown": "DeMarvion Overshown",
    "Ja'Quan Mcmillian": "Ja'Quan McMillian"

    # 'Kenny Moore Ii': 'Kenny Moore II',
    # 'Greg Newsome Ii': 'Greg Newsome II'
}


def proper_case_name(name):
    suffixes = ["Ii", "Iii", "Iv"]
    name_parts = name.split()
    properly_cased_parts = [part.upper() if part in suffixes else part for part in name_parts]
    return ' '.join(properly_cased_parts)


def capitalize_first_name(name):
    parts = name.split()
    if len(parts) > 1 and len(parts[0]) < 3:
        parts[0] = parts[0].upper()
        return proper_case_name(' '.join(parts))
    else:
        return proper_case_name(name)


def replace_names(comment):
    for old_name, new_name in names_to_fix.items():
        comment = comment.replace(old_name, new_name)
    return proper_case_name(comment)



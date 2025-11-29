import  input

beam, loads, supports = input.build_inputs(
    40,
    raw_loads= [(0,30),(2,40),(10,-50)],
    raw_supports=[(20,+40)]
)
print(beam)
print(loads)
print(supports)
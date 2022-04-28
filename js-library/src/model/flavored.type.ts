interface Flavored<Type> {
  _type?: Type
}

export type FlavoredType<Type, Name> = Type & Flavored<Name>

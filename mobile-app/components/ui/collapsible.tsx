import { PropsWithChildren, useState } from 'react'
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native'

// simple collapsible component
export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <View>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <Text style={styles.arrow}>{isOpen ? '▼' : '▶'}</Text>
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
})
